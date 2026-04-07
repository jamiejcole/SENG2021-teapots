import mongoose from "mongoose";
import type { OrderData, UBLValue } from "../types/order.types";
import type { CreateOrderPayload } from "../types/order.dto";
import { InvoiceCalculator } from "../domain/InvoiceCalculator";
import { sha256 } from "../models/hash";

const UNKNOWN_TEXT = "UNKNOWN";
const UNKNOWN_COUNTRY = "XX";

function ublText(v: string | UBLValue | undefined): string | undefined {
    return typeof v === "string" ? v : v?.value;
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

/**
 * MongoDB order document fields (excluding xml hash) from OrderData + raw XML.
 */
export function projectOrderDocumentFields(
    orderObj: OrderData,
    normalizedOrderXml: string,
    payload: CreateOrderPayload,
    userId?: string
) {
    const orderLines = toArray(orderObj.OrderLine);
    const taxRate = payload.taxRate ?? 0;
    const calculator = new InvoiceCalculator(orderLines as any[], taxRate);

    const buyerParty = orderObj.BuyerCustomerParty?.Party;
    const sellerParty = orderObj.SellerSupplierParty?.Party;

    const createdBy =
        userId && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : undefined;

    return {
        status: "RECEIVED" as const,
        orderStatus: (payload.orderStatus === "draft" ? "draft" : "created") as "draft" | "created",
        ...(typeof payload.invoiceStatusNote === "string" ? { invoiceStatusNote: payload.invoiceStatusNote } : {}),
        ...(createdBy ? { createdBy } : {}),
        orderId: ublText(orderObj.ID) ?? UNKNOWN_TEXT,
        issueDate: ublText(orderObj.IssueDate) ?? new Date().toISOString().slice(0, 10),
        currency: payload.currency.trim().toUpperCase(),
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
            taxRate,
        })),
        customizationId: ublText((orderObj as any).CustomizationID),
        profileId: ublText((orderObj as any).ProfileID),
        totals: {
            subTotal: Number(calculator.summary.lineExtensionTotal),
            taxTotal: Number(calculator.summary.taxTotal),
            payableAmount: Number(calculator.summary.payableAmount),
        },
        orderXml: normalizedOrderXml,
        xmlSha256: sha256(normalizedOrderXml),
        ...(payload.delivery?.address
            ? {
                  delivery: {
                      street: payload.delivery.address.street,
                      city: payload.delivery.address.city,
                      postalCode: payload.delivery.address.postalCode,
                      country: payload.delivery.address.country,
                      deliveryStart: payload.delivery.requestedDeliveryStart,
                      deliveryEnd: payload.delivery.requestedDeliveryEnd,
                  },
              }
            : {}),
        ...(payload.deliveryTerms?.trim() ? { deliveryTerms: payload.deliveryTerms.trim() } : {}),
    };
}
