import * as libxml from "libxmljs2";
import mongoose from "mongoose";
import type { OrderData, UBLValue } from "../types/order.types";
import type { InvoiceSupplement } from "../types/invoice.types";
import { InvoiceCalculator } from "../domain/InvoiceCalculator";
import { sha256 } from "../models/hash";
import { OrderModel } from "../models/order.model";
import { InvoiceModel } from "../models/invoice.model";

type PersistInvoiceRequestArgs = {
  orderXml: string;
  orderObj: OrderData;
  invoiceXml: string;
  invoiceSupplement: InvoiceSupplement;
  /** Authenticated user (Mongo ObjectId string) when invoice is created via v2 API */
  userId?: string;
};

const UNKNOWN_TEXT = "UNKNOWN";
const UNKNOWN_COUNTRY = "XX";

function ublText(v: string | UBLValue | undefined): string | undefined {
  return typeof v === "string" ? v : v?.value;
}

function isoDateToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function toArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}

function mapPartyAddress(party: any) {
  const address = party?.PostalAddress ?? {};
  return {
    street:
      `${ublText(address.StreetName) ?? UNKNOWN_TEXT} ${ublText(address.BuildingNumber) ?? ""}`.trim() ||
      UNKNOWN_TEXT,
    city: ublText(address.CityName) ?? UNKNOWN_TEXT,
    postalCode: ublText(address.PostalZone) ?? UNKNOWN_TEXT,
    country: ublText(address.Country?.IdentificationCode) ?? UNKNOWN_COUNTRY,
  };
}

function pickText(doc: libxml.Document, xpath: string, namespaces: Record<string, string>) {
  const node = doc.get(xpath, namespaces) as unknown as libxml.Element | null;
  return node?.text();
}

const INV_NAMESPACES = {
  inv: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
};

/**
 * Core scalar + party + line projection for an invoice document (XML body + queryable fields).
 * Used on first save and when regenerating UBL from the stored order.
 */
export function buildInvoiceSetFields(
  orderObj: OrderData,
  invoiceSupplement: InvoiceSupplement,
  normalizedInvoiceXml: string
) {
  const normalized = normalizedInvoiceXml.trim().replace(/\r\n/g, "\n");
  const invoiceXmlHash = sha256(normalized);

  const orderLines = toArray(orderObj.OrderLine);
  const calculator = new InvoiceCalculator(orderLines as any[], invoiceSupplement.taxRate);

  const buyerParty = orderObj.BuyerCustomerParty?.Party;
  const sellerParty = orderObj.SellerSupplierParty?.Party;

  const orderDoc = {
    orderId: ublText(orderObj.ID) ?? UNKNOWN_TEXT,
    issueDate: ublText(orderObj.IssueDate) ?? isoDateToday(),
    currency: invoiceSupplement.currencyCode,

    buyer: {
      name: ublText(buyerParty?.PartyName?.Name) ?? "Buyer",
      id: ublText(buyerParty?.EndpointID),
      email: ublText(buyerParty?.Contact?.ElectronicMail),
      address: mapPartyAddress(buyerParty),
    },

    seller: {
      name: ublText(sellerParty?.PartyName?.Name) ?? "Seller",
      id: ublText(sellerParty?.EndpointID),
      email: ublText(sellerParty?.Contact?.ElectronicMail),
      address: mapPartyAddress(sellerParty),
    },

    lines: orderLines.map((l: any, idx: number) => ({
      lineId: String(ublText(l.LineItem?.ID) ?? idx + 1),
      description: String(ublText(l.LineItem?.Item?.Name) ?? "Item"),
      quantity: Number(ublText(l.LineItem?.Quantity) ?? 1),
      unitCode: l.LineItem?.Quantity?.["@unitCode"],
      unitPrice: Number(ublText(l.LineItem?.Price?.PriceAmount) ?? 0),
      taxRate: invoiceSupplement.taxRate,
    })),

    totals: {
      subTotal: Number(calculator.summary.lineExtensionTotal),
      taxTotal: Number(calculator.summary.taxTotal),
      payableAmount: Number(calculator.summary.payableAmount),
    },
  };

  const invDoc = libxml.parseXml(normalized);
  const parsedInvoiceId = pickText(invDoc, "/inv:Invoice/cbc:ID", INV_NAMESPACES);
  const parsedIssueDate = pickText(invDoc, "/inv:Invoice/cbc:IssueDate", INV_NAMESPACES);
  const parsedCurrency = pickText(invDoc, "/inv:Invoice/cbc:DocumentCurrencyCode", INV_NAMESPACES);

  return {
    invoiceId: parsedInvoiceId ?? `INV-${Date.now()}`,
    issueDate: parsedIssueDate ?? isoDateToday(),
    currency: parsedCurrency ?? invoiceSupplement.currencyCode,

    seller: orderDoc.seller,
    buyer: orderDoc.buyer,

    lines: orderDoc.lines.map((l: any, idx: number) => ({
      lineId: String(idx + 1),
      description: l.description,
      quantity: l.quantity,
      unitCode: l.unitCode,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
    })),

    orderReference: { orderId: orderDoc.orderId },
    paymentTerms: invoiceSupplement.paymentTerms?.note,

    totals: orderDoc.totals,

    invoiceXml: normalized,
    xmlSha256: invoiceXmlHash,
  };
}

/**
 * Persists a successfully-validated Order + generated Invoice to MongoDB.
 *
 * We store both:
 * - the raw XML strings (for audit/replay)
 * - a "projection" of useful fields (IDs, parties, totals, lines) for querying.
 *
 * Inserts are idempotent on `xmlSha256` to avoid duplicate documents for the same XML payload.
 *
 * @returns Mongo `_id` of the invoice row (new or existing with the same XML hash).
 */
export async function persistInvoiceRequest(args: PersistInvoiceRequestArgs): Promise<string | null> {
  const { orderXml, orderObj, invoiceXml, invoiceSupplement, userId } = args;

  const createdBy =
    userId && mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : undefined;

  const normalizedOrderXml = orderXml.trim().replace(/\r\n/g, "\n");
  const normalizedInvoiceXml = invoiceXml.trim().replace(/\r\n/g, "\n");

  const orderXmlHash = sha256(normalizedOrderXml);

  const orderLines = toArray(orderObj.OrderLine);
  const calculator = new InvoiceCalculator(orderLines as any[], invoiceSupplement.taxRate);

  const buyerParty = orderObj.BuyerCustomerParty?.Party;
  const sellerParty = orderObj.SellerSupplierParty?.Party;

  const orderDoc = {
    status: "RECEIVED",
    orderStatus: "created" as const,
    orderId: ublText(orderObj.ID) ?? UNKNOWN_TEXT,
    issueDate: ublText(orderObj.IssueDate) ?? isoDateToday(),
    currency: invoiceSupplement.currencyCode,

    buyer: {
      name: ublText(buyerParty?.PartyName?.Name) ?? "Buyer",
      id: ublText(buyerParty?.EndpointID),
      email: ublText(buyerParty?.Contact?.ElectronicMail),
      address: mapPartyAddress(buyerParty),
    },

    seller: {
      name: ublText(sellerParty?.PartyName?.Name) ?? "Seller",
      id: ublText(sellerParty?.EndpointID),
      email: ublText(sellerParty?.Contact?.ElectronicMail),
      address: mapPartyAddress(sellerParty),
    },

    lines: orderLines.map((l: any, idx: number) => ({
      lineId: String(ublText(l.LineItem?.ID) ?? idx + 1),
      description: String(ublText(l.LineItem?.Item?.Name) ?? "Item"),
      quantity: Number(ublText(l.LineItem?.Quantity) ?? 1),
      unitCode: l.LineItem?.Quantity?.["@unitCode"],
      unitPrice: Number(ublText(l.LineItem?.Price?.PriceAmount) ?? 0),
      taxRate: invoiceSupplement.taxRate,
    })),

    customizationId: ublText((orderObj as any).CustomizationID),
    profileId: ublText((orderObj as any).ProfileID),

    totals: {
      subTotal: Number(calculator.summary.lineExtensionTotal),
      taxTotal: Number(calculator.summary.taxTotal),
      payableAmount: Number(calculator.summary.payableAmount),
    },

    orderXml: normalizedOrderXml,
    xmlSha256: orderXmlHash,
  };

  const existingOrder = await OrderModel.findOne({
    $or: [{ xmlSha256: orderXmlHash }, { orderId: orderDoc.orderId }],
  }).exec();

  if (existingOrder === null) {
    await OrderModel.create(orderDoc); // rely on schema validation
  } else if (existingOrder.xmlSha256 !== orderXmlHash) {
    // Same business Order ID but different XML representation (e.g. whitespace/line endings)
    await OrderModel.updateOne({ _id: existingOrder._id }, { $set: orderDoc }).exec();
  }

  const coreFields = buildInvoiceSetFields(orderObj, invoiceSupplement, normalizedInvoiceXml);

  const invoiceDoc = {
    status: "GENERATED" as const,
    ...(createdBy ? { createdBy } : {}),
    lifecycleStatus: "SAVED" as const,
    activity: [
      {
        at: new Date(),
        type: "CREATED",
        message: "Invoice generated and stored from UBL order",
      },
    ],
    ...coreFields,
  };

  const existingByXmlHash = await InvoiceModel.findOne({ xmlSha256: coreFields.xmlSha256 }).exec();
  if (existingByXmlHash !== null) {
    return existingByXmlHash._id.toString();
  }

  /**
   * `invoiceId` is unique in Mongo, but idempotency above only keys on `xmlSha256`.
   * Regenerating with the **same business invoice number** (e.g. Invoice Studio default "STUDIO-1001")
   * produces new XML → new hash → insert attempt → E11000 duplicate `invoiceId`.
   * For authenticated creates, replace the row for the same user + same `invoiceId`.
   */
  if (createdBy) {
    const sameBizIdForUser = await InvoiceModel.findOne({
      createdBy,
      invoiceId: coreFields.invoiceId,
    }).exec();

    if (sameBizIdForUser !== null) {
      const { activity: _a, ...docWithoutActivity } = invoiceDoc;
      await InvoiceModel.updateOne(
        { _id: sameBizIdForUser._id },
        {
          $set: {
            ...docWithoutActivity,
            status: "UPDATED",
            lifecycleStatus: "SAVED",
            invoiceXml: normalizedInvoiceXml,
            xmlSha256: coreFields.xmlSha256,
          },
          $push: {
            activity: {
              at: new Date(),
              type: "REGENERATED",
              message: "Invoice regenerated and stored (same business invoice ID for this account)",
            },
          },
        }
      ).exec();
      return sameBizIdForUser._id.toString();
    }
  }

  const doc = await InvoiceModel.create(invoiceDoc);
  return doc._id.toString();
}

