import mongoose from "mongoose";
import { create as xmlCreate } from "xmlbuilder2";
import { OrderModel } from "../../../models/order.model";
import { sha256 } from "../../../models/hash";

function normalizeXml(xml: string): string {
    return xml.trim().replace(/\r\n/g, "\n");
}

/**
 * Recursively converts a plain JSON object to XML elements within the given parent node.
 */
function buildXmlFromJson(parent: any, data: any): void {
    if (typeof data !== "object" || data === null) return;

    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith("@")) continue;

        const instances = Array.isArray(value) ? value : [value];

        for (const item of instances) {
            if (item === null || item === undefined) continue;

            const attrs: Record<string, string> = {};
            if (typeof item === "object") {
                for (const k of Object.keys(item)) {
                    if (k.startsWith("@")) attrs[k.substring(1)] = String((item as any)[k]);
                }
            }

            const node = parent.ele(key, attrs);
            if (typeof item === "object" && item !== null) {
                if ("value" in item) {
                    node.txt(String((item as any).value));
                } else {
                    buildXmlFromJson(node, item);
                }
            } else {
                node.txt(String(item));
            }
        }
    }
}

/**
 * Converts raw UBL JSON data to UBL Order XML string.
 */
export function jsonToOrderXml(data: Record<string, any>): string {
    const doc = xmlCreate({ version: "1.0", encoding: "UTF-8" });
    const order = doc.ele("Order", {
        xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Order-2",
        "xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        "xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    });
    buildXmlFromJson(order, data);
    return doc.end({ prettyPrint: true });
}

/**
 * Creates a new order document in the database from raw JSON data.
 */
export async function createOrder(data: Record<string, any>, userId: string) {
    const orderXml = normalizeXml(jsonToOrderXml(data));
    const xmlHash = sha256(orderXml);

    const orderId = String(
        (data.ID && (typeof data.ID === "string" ? data.ID : (data.ID as any).value)) ||
        `ORD-${Date.now()}`
    );

    const doc = await OrderModel.create({
        status: "RECEIVED",
        orderId,
        issueDate: String(
            (data.IssueDate && (typeof data.IssueDate === "string" ? data.IssueDate : (data.IssueDate as any).value)) ||
            new Date().toISOString().slice(0, 10)
        ),
        currency: String(
            (data.DocumentCurrencyCode && (typeof data.DocumentCurrencyCode === "string" ? data.DocumentCurrencyCode : (data.DocumentCurrencyCode as any).value)) ||
            "AUD"
        ),
        buyer: {
            name: getBuyerName(data) || "Buyer",
            address: { street: "Unknown", city: "Unknown", postalCode: "Unknown", country: "XX" },
        },
        seller: {
            name: getSellerName(data) || "Seller",
            address: { street: "Unknown", city: "Unknown", postalCode: "Unknown", country: "XX" },
        },
        lines: extractLines(data),
        totals: { subTotal: 0, taxTotal: 0, payableAmount: 0 },
        orderXml,
        xmlSha256: xmlHash,
        userId,
        rawData: data,
    });

    return doc;
}

function getBuyerName(data: any): string {
    try {
        const party = data?.BuyerCustomerParty?.Party;
        if (!party) return "";
        const partyName = party.PartyName;
        if (Array.isArray(partyName)) {
            return partyName[0]?.Name?.value || partyName[0]?.Name || "";
        }
        return partyName?.Name?.value || partyName?.Name || "";
    } catch {
        return "";
    }
}

function getSellerName(data: any): string {
    try {
        const party = data?.SellerSupplierParty?.Party;
        if (!party) return "";
        const partyName = party.PartyName;
        if (Array.isArray(partyName)) {
            return partyName[0]?.Name?.value || partyName[0]?.Name || "";
        }
        return partyName?.Name?.value || partyName?.Name || "";
    } catch {
        return "";
    }
}

function extractLines(data: any): Array<{ lineId: string; description: string; quantity: number; unitPrice: number; taxRate: number }> {
    try {
        const orderLines = data?.OrderLine;
        if (!orderLines) return [{ lineId: "1", description: "Item", quantity: 1, unitPrice: 0, taxRate: 0 }];
        const lines = Array.isArray(orderLines) ? orderLines : [orderLines];
        return lines.map((l: any, idx: number) => ({
            lineId: String(l?.LineItem?.ID?.value || l?.LineItem?.ID || idx + 1),
            description: String(l?.LineItem?.Item?.Name?.value || l?.LineItem?.Item?.Name || l?.LineItem?.Item?.Description?.[0] || "Item"),
            quantity: Number(l?.LineItem?.Quantity?.value || l?.LineItem?.Quantity || 1),
            unitCode: l?.LineItem?.Quantity?.["@unitCode"] || undefined,
            unitPrice: Number(l?.LineItem?.Price?.PriceAmount?.value || l?.LineItem?.Price?.PriceAmount || 0),
            taxRate: 0,
        }));
    } catch {
        return [{ lineId: "1", description: "Item", quantity: 1, unitPrice: 0, taxRate: 0 }];
    }
}

/**
 * Lists all orders for a given user.
 */
export async function listOrdersForUser(userId: string) {
    return OrderModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
}

/**
 * Gets an order by MongoDB ObjectId for a given user.
 */
export async function getOrderById(orderId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) return null;
    return OrderModel.findOne({ _id: orderId, userId }).lean().exec();
}

/**
 * Updates an order by MongoDB ObjectId for a given user.
 */
export async function updateOrder(orderId: string, userId: string, data: Record<string, any>) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) return null;

    const orderXml = normalizeXml(jsonToOrderXml(data));
    const xmlHash = sha256(orderXml);

    const newOrderId = String(
        (data.ID && (typeof data.ID === "string" ? data.ID : (data.ID as any).value)) ||
        `ORD-${Date.now()}`
    );

    return OrderModel.findOneAndUpdate(
        { _id: orderId, userId },
        {
            $set: {
                orderId: newOrderId,
                issueDate: String(
                    (data.IssueDate && (typeof data.IssueDate === "string" ? data.IssueDate : (data.IssueDate as any).value)) ||
                    new Date().toISOString().slice(0, 10)
                ),
                buyer: {
                    name: getBuyerName(data) || "Buyer",
                    address: { street: "Unknown", city: "Unknown", postalCode: "Unknown", country: "XX" },
                },
                seller: {
                    name: getSellerName(data) || "Seller",
                    address: { street: "Unknown", city: "Unknown", postalCode: "Unknown", country: "XX" },
                },
                lines: extractLines(data),
                orderXml,
                xmlSha256: xmlHash,
                rawData: data,
            },
        },
        { new: true }
    ).lean().exec();
}

/**
 * Deletes an order by MongoDB ObjectId for a given user.
 */
export async function deleteOrder(orderId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) return null;
    return OrderModel.findOneAndDelete({ _id: orderId, userId }).lean().exec();
}
