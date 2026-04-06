import crypto from "node:crypto";
import mongoose from "mongoose";
import { DespatchModel } from "../../../models/despatch.model";
import { OrderModel } from "../../../models/order.model";
import { HttpError } from "../../../errors/HttpError";
import type { CreateDespatchPayload } from "../../../types/despatch.dto";
import type { OrderPartyDto } from "../../../types/order.dto";
import { sendDespatchAdviceEmail } from "../../../utils/mailgun.service";
import { assertCreateDespatchPayload } from "./despatch.validation";

type DespatchLean = {
    despatchId: string;
    orderId: string;
    despatchStatus: string;
    despatchDate: string;
    carrierName?: string;
    trackingId?: string;
    notes?: string;
    supplierParty: {
        name: string;
        address: { street: string; city: string; postalCode: string; country: string };
    };
    deliveryParty: {
        name: string;
        address: { street: string; city: string; postalCode: string; country: string };
    };
    lines: Array<{ lineId: string; description: string; quantity: number; unitCode?: string }>;
};

function escHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildDespatchEmailBodies(doc: DespatchLean): { html: string; text: string } {
    const linesRows = doc.lines
        .map(
            (l) =>
                `<tr><td>${escHtml(l.lineId)}</td><td>${escHtml(l.description)}</td><td>${l.quantity}</td><td>${escHtml(l.unitCode ?? "")}</td></tr>`
        )
        .join("");
    const notesBlock = doc.notes
        ? `<p><strong>Notes:</strong><br/>${escHtml(doc.notes).replace(/\n/g, "<br/>")}</p>`
        : "";
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5">
<h2>Despatch advice</h2>
<p><strong>Despatch ID:</strong> ${escHtml(doc.despatchId)}<br/>
<strong>Order reference:</strong> ${escHtml(doc.orderId)}<br/>
<strong>Status:</strong> ${escHtml(doc.despatchStatus)}<br/>
<strong>Date:</strong> ${escHtml(doc.despatchDate)}<br/>
<strong>Carrier:</strong> ${escHtml(doc.carrierName ?? "—")}<br/>
<strong>Tracking:</strong> ${escHtml(doc.trackingId ?? "—")}</p>
${notesBlock}
<h3>Supplier</h3><p>${escHtml(doc.supplierParty.name)}<br/>${escHtml(doc.supplierParty.address.street)}, ${escHtml(doc.supplierParty.address.city)}</p>
<h3>Delivery</h3><p>${escHtml(doc.deliveryParty.name)}<br/>${escHtml(doc.deliveryParty.address.street)}, ${escHtml(doc.deliveryParty.address.city)}</p>
<h3>Lines</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse"><thead><tr><th>Line</th><th>Description</th><th>Qty</th><th>Unit</th></tr></thead><tbody>${linesRows}</tbody></table>
<p style="color:#666;font-size:12px">Sent from Teapot Invoicing</p>
</body></html>`;
    const text = [
        `Despatch: ${doc.despatchId}`,
        `Order: ${doc.orderId}`,
        `Status: ${doc.despatchStatus}`,
        `Date: ${doc.despatchDate}`,
        `Carrier: ${doc.carrierName ?? "—"}`,
        `Tracking: ${doc.trackingId ?? "—"}`,
        doc.notes ? `Notes: ${doc.notes}` : "",
        "",
        "Lines:",
        ...doc.lines.map((l) => `  ${l.lineId}  ${l.description}  qty ${l.quantity}`),
    ]
        .filter(Boolean)
        .join("\n");
    return { html, text };
}

function userOid(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return new mongoose.Types.ObjectId(userId);
}

function mapPartyToDoc(p: OrderPartyDto) {
    return {
        name: p.name.trim(),
        id: p.id?.trim(),
        email: p.email?.trim().toLowerCase(),
        address: {
            street: p.address.street.trim(),
            city: p.address.city.trim(),
            postalCode: p.address.postalCode.trim(),
            country: p.address.country.trim(),
        },
    };
}

export async function createDespatch(userId: string, body: unknown) {
    assertCreateDespatchPayload(body);
    const payload = body as CreateDespatchPayload;
    const uid = userOid(userId);
    if (!uid) throw new HttpError(401, "Invalid user");

    const order = await OrderModel.findOne({ orderId: payload.orderId.trim(), createdBy: uid }).exec();
    if (!order) {
        throw new HttpError(404, "Order not found for this account");
    }
    if (order.orderStatus === "cancelled") {
        throw new HttpError(400, "Cannot create despatch for a cancelled order");
    }

    const despatchId = payload.despatchId?.trim() || `DES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const exists = await DespatchModel.findOne({ despatchId }).exec();
    if (exists) {
        throw new HttpError(409, "Despatch ID already exists");
    }

    const status =
        payload.despatchStatus && ["not_despatched", "despatched", "partially_despatched"].includes(payload.despatchStatus)
            ? payload.despatchStatus
            : "despatched";

    const doc = await DespatchModel.create({
        despatchId,
        createdBy: uid,
        orderId: payload.orderId.trim(),
        despatchDate: payload.despatchDate.trim(),
        despatchStatus: status,
        carrierName: payload.carrierName?.trim(),
        trackingId: payload.trackingId?.trim(),
        notes: payload.notes?.trim(),
        supplierParty: mapPartyToDoc(payload.supplierParty),
        deliveryParty: mapPartyToDoc(payload.deliveryParty),
        lines: payload.lines.map((l) => ({
            lineId: l.lineId.trim(),
            description: l.description.trim(),
            quantity: l.quantity,
            unitCode: l.unitCode?.trim(),
        })),
    });

    /** Partial fulfilment advances order lifecycle */
    if (status === "partially_despatched") {
        await OrderModel.updateOne({ _id: order._id }, { $set: { orderStatus: "partially_fulfilled" } }).exec();
    } else if (status === "despatched") {
        await OrderModel.updateOne({ _id: order._id }, { $set: { orderStatus: "fulfilled" } }).exec();
    }

    return DespatchModel.findById(doc._id).select("-despatchXml").lean().exec();
}

export async function listDespatches(userId: string, filter?: { activeOnly?: boolean }) {
    const uid = userOid(userId);
    if (!uid) return [];
    const q: Record<string, unknown> = { createdBy: uid };
    if (filter?.activeOnly) {
        q.despatchStatus = { $ne: "fulfilment_cancelled" };
    }
    return DespatchModel.find(q).sort({ updatedAt: -1 }).select("-despatchXml").limit(200).lean().exec();
}

export async function getDespatch(userId: string, despatchId: string) {
    const uid = userOid(userId);
    if (!uid) return null;
    return DespatchModel.findOne({ despatchId: despatchId.trim(), createdBy: uid }).select("-despatchXml").lean().exec();
}

export async function cancelOrderForUser(userId: string, orderId: string) {
    const uid = userOid(userId);
    if (!uid) return null;
    const order = await OrderModel.findOne({ orderId: orderId.trim(), createdBy: uid }).exec();
    if (!order) return null;
    await OrderModel.updateOne(
        { _id: order._id },
        { $set: { orderStatus: "cancelled", status: "REJECTED" } }
    ).exec();
    return OrderModel.findById(order._id).select("-orderXml").lean().exec();
}

export async function listCancelledOrders(userId: string) {
    const uid = userOid(userId);
    if (!uid) return [];
    return OrderModel.find({ createdBy: uid, orderStatus: "cancelled" })
        .sort({ updatedAt: -1 })
        .select("-orderXml")
        .limit(200)
        .lean()
        .exec();
}

export async function cancelFulfilment(userId: string, despatchId: string) {
    const uid = userOid(userId);
    if (!uid) return null;
    const d = await DespatchModel.findOne({ despatchId: despatchId.trim(), createdBy: uid }).exec();
    if (!d) return null;
    await DespatchModel.updateOne({ _id: d._id }, { $set: { despatchStatus: "fulfilment_cancelled" } }).exec();
    return DespatchModel.findById(d._id).select("-despatchXml").lean().exec();
}

export async function listFulfilmentCancelled(userId: string) {
    const uid = userOid(userId);
    if (!uid) return [];
    return DespatchModel.find({ createdBy: uid, despatchStatus: "fulfilment_cancelled" })
        .sort({ updatedAt: -1 })
        .select("-despatchXml")
        .limit(200)
        .lean()
        .exec();
}

export async function emailDespatchAdviceForUser(userId: string, despatchId: string, to: string) {
    const doc = await getDespatch(userId, despatchId);
    if (!doc) throw new HttpError(404, "Despatch not found");
    const typed = doc as unknown as DespatchLean;
    const { html, text } = buildDespatchEmailBodies(typed);
    await sendDespatchAdviceEmail(to, `Despatch notice: ${typed.despatchId}`, html, text);
    return { message: "Despatch email sent", to };
}
