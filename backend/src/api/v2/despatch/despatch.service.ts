import * as crypto from "crypto";
import * as libxml from "libxmljs2";
import { DespatchAdviceModel } from "../../../models/despatchAdvice.model";
import { OrderCancellationModel } from "../../../models/orderCancellation.model";
import { FulfilmentCancellationModel } from "../../../models/fulfilmentCancellation.model";

function uuid(): string {
    return crypto.randomUUID();
}

function nowUnix(): number {
    return Math.floor(Date.now() / 1000);
}

function nowIso(): string {
    return new Date().toISOString();
}

function getText(doc: libxml.Document, xpath: string, ns: Record<string, string>): string {
    const node = doc.get(xpath, ns) as unknown as libxml.Element | null;
    return node?.text()?.trim() ?? "";
}

/**
 * Generates a minimal UBL 2.1 DespatchAdvice XML string from a UBL Order XML string.
 */
export function generateDespatchAdviceXml(orderXml: string, adviceId: string): string {
    const doc = libxml.parseXml(orderXml.trim());
    const ns = {
        ord: "urn:oasis:names:specification:ubl:schema:xsd:Order-2",
        cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    };

    const orderId = getText(doc, "/ord:Order/cbc:ID", ns) || "UNKNOWN";
    const issueDate = getText(doc, "/ord:Order/cbc:IssueDate", ns) || new Date().toISOString().slice(0, 10);
    const buyerName = getText(doc, "/ord:Order/cac:BuyerCustomerParty/cac:Party/cac:PartyName/cbc:Name", ns) || "Buyer";
    const sellerName = getText(doc, "/ord:Order/cac:SellerSupplierParty/cac:Party/cac:PartyName/cbc:Name", ns) || "Seller";

    return `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>${adviceId}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cac:OrderReference>
    <cbc:ID>${orderId}</cbc:ID>
  </cac:OrderReference>
  <cac:DespatchSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(sellerName)}</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:DespatchSupplierParty>
  <cac:DeliveryCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escapeXml(buyerName)}</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:DeliveryCustomerParty>
  <cac:Shipment>
    <cbc:ID>1</cbc:ID>
    <cac:DespatchLine>
      <cbc:ID>1</cbc:ID>
      <cbc:DeliveredQuantity unitCode="EA">1</cbc:DeliveredQuantity>
      <cac:OrderLineReference>
        <cbc:LineID>1</cbc:LineID>
      </cac:OrderLineReference>
    </cac:DespatchLine>
  </cac:Shipment>
</DespatchAdvice>`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Creates a DespatchAdvice record from Order XML and stores it in the DB.
 */
export async function createDespatchAdvice(orderXml: string, userId: string) {
    const adviceId = uuid();
    const executedAt = nowUnix();
    const despatchAdviceXml = generateDespatchAdviceXml(orderXml.trim(), adviceId);

    const doc = await DespatchAdviceModel.create({
        adviceId,
        userId,
        despatchAdviceXml,
        orderXml: orderXml.trim(),
        executedAt,
    });

    return { adviceId: doc.adviceId, executedAt: doc.executedAt };
}

/**
 * Retrieves a DespatchAdvice by adviceId for a given user.
 */
export async function getDespatchAdviceByAdviceId(adviceId: string, userId: string) {
    return DespatchAdviceModel.findOne({ adviceId, userId }).lean().exec();
}

/**
 * Retrieves a DespatchAdvice by matching the stored orderXml for a given user.
 */
export async function getDespatchAdviceByOrderXml(orderXml: string, userId: string) {
    return DespatchAdviceModel.findOne({ orderXml: orderXml.trim(), userId }).lean().exec();
}

/**
 * Lists all DespatchAdvice records for a given user.
 */
export async function listDespatchAdvices(userId: string) {
    return DespatchAdviceModel.find({ userId }).sort({ executedAt: -1 }).lean().exec();
}

/**
 * Creates an OrderCancellation and links it to a DespatchAdvice.
 */
export async function createOrderCancellation(
    adviceId: string,
    userId: string,
    cancellationDocument: string
) {
    const advice = await DespatchAdviceModel.findOne({ adviceId, userId }).lean().exec();
    if (!advice) return null;

    let reason = "Cancellation requested";
    try {
        const doc = libxml.parseXml(cancellationDocument.trim());
        const reasonNode = doc.get("//*[local-name()='Reason']") as unknown as libxml.Element | null;
        if (reasonNode) reason = reasonNode.text().trim() || reason;
    } catch {
        // use default reason
    }

    const cancellationId = uuid();
    const executedAt = nowIso();

    const cancellation = await OrderCancellationModel.create({
        cancellationId,
        adviceId,
        userId,
        cancellationDocument,
        cancellationReason: reason,
        executedAt,
    });

    return cancellation;
}

/**
 * Retrieves an OrderCancellation by adviceId or cancellationId for a given user.
 */
export async function getOrderCancellation(
    userId: string,
    adviceId?: string,
    cancellationId?: string
) {
    if (adviceId) {
        return OrderCancellationModel.findOne({ adviceId, userId }).lean().exec();
    }
    if (cancellationId) {
        return OrderCancellationModel.findOne({ cancellationId, userId }).lean().exec();
    }
    return null;
}

/**
 * Creates a FulfilmentCancellation linked to a DespatchAdvice.
 */
export async function createFulfilmentCancellation(
    adviceId: string,
    userId: string,
    reason: string
) {
    const advice = await DespatchAdviceModel.findOne({ adviceId, userId }).lean().exec();
    if (!advice) return null;

    const fulfilmentCancellationId = uuid();
    const executedAt = nowIso();
    const fulfilmentCancellationXml = `<?xml version="1.0" encoding="UTF-8"?>
<FulfilmentCancellation xmlns="urn:oasis:names:specification:ubl:schema:xsd:FulfilmentCancellation-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${fulfilmentCancellationId}</cbc:ID>
  <cbc:Note>${escapeXml(reason)}</cbc:Note>
</FulfilmentCancellation>`;

    const cancellation = await FulfilmentCancellationModel.create({
        fulfilmentCancellationId,
        adviceId,
        userId,
        cancellationReason: reason,
        fulfilmentCancellationXml,
        executedAt,
    });

    return cancellation;
}

/**
 * Retrieves a FulfilmentCancellation by adviceId or fulfilmentCancellationId for a given user.
 */
export async function getFulfilmentCancellation(
    userId: string,
    adviceId?: string,
    fulfilmentCancellationId?: string
) {
    if (adviceId) {
        return FulfilmentCancellationModel.findOne({ adviceId, userId }).lean().exec();
    }
    if (fulfilmentCancellationId) {
        return FulfilmentCancellationModel.findOne({ fulfilmentCancellationId, userId }).lean().exec();
    }
    return null;
}
