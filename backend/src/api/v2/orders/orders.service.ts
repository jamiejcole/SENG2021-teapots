import mongoose from "mongoose";
import { OrderModel } from "../../../models/order.model";
import { HttpError } from "../../../errors/HttpError";
import { buildOrderFromPayload } from "../../../domain/OrderUblBuilder";
import { projectOrderDocumentFields } from "../../../db/projectOrderDocument";
import { assertCreateOrderPayload } from "./orders.validation";
import { validateUBL } from "../invoices/invoices.validation";
import type { CreateOrderPayload } from "../../../types/order.dto";

function userOid(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }
    return new mongoose.Types.ObjectId(userId);
}

export async function resolveOrderForUser(orderKey: string, userId: string) {
    const uid = userOid(userId);
    if (!uid) {
        return null;
    }
    if (mongoose.Types.ObjectId.isValid(orderKey)) {
        const byId = await OrderModel.findOne({ _id: orderKey, createdBy: uid }).exec();
        if (byId) return byId;
    }
    return OrderModel.findOne({ orderId: orderKey, createdBy: uid }).exec();
}

export async function listOrdersForUser(userId: string, limit = 200) {
    const uid = userOid(userId);
    if (!uid) {
        return [];
    }
    return OrderModel.find({ createdBy: uid })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select("-orderXml")
        .lean()
        .exec();
}

export async function createOrderFromPayload(userId: string, body: unknown) {
    assertCreateOrderPayload(body);
    const payload = body as CreateOrderPayload;
    const { orderXml, orderData } = buildOrderFromPayload(payload);
    const normalized = orderXml.trim().replace(/\r\n/g, "\n");
    validateUBL(normalized, "Order");

    const docFields = projectOrderDocumentFields(orderData, normalized, payload, userId);

    const existing = await OrderModel.findOne({ orderId: docFields.orderId }).exec();
    if (existing) {
        throw new HttpError(409, "An order with this orderId already exists");
    }

    const doc = await OrderModel.create(docFields);
    return doc.toObject();
}

export async function updateOrderFromPayload(userId: string, orderKey: string, body: unknown) {
    assertCreateOrderPayload(body);
    const payload = body as CreateOrderPayload;
    const existing = await resolveOrderForUser(orderKey, userId);
    if (!existing) {
        return null;
    }
    if (existing.orderId !== payload.orderId.trim()) {
        const clash = await OrderModel.findOne({ orderId: payload.orderId.trim() }).exec();
        if (clash && String(clash._id) !== String(existing._id)) {
            throw new HttpError(409, "Another order already uses this orderId");
        }
    }
    const { orderXml, orderData } = buildOrderFromPayload(payload);
    const normalized = orderXml.trim().replace(/\r\n/g, "\n");
    validateUBL(normalized, "Order");
    const docFields = projectOrderDocumentFields(orderData, normalized, payload, userId);
    await OrderModel.updateOne({ _id: existing._id }, { $set: docFields }).exec();
    return OrderModel.findById(existing._id).select("-orderXml").lean().exec();
}

export async function deleteOrderForUser(userId: string, orderKey: string) {
    const existing = await resolveOrderForUser(orderKey, userId);
    if (!existing) {
        return null;
    }
    await OrderModel.deleteOne({ _id: existing._id }).exec();
    return { deleted: true };
}

export async function getOrderDetail(userId: string, orderKey: string, includeXml: boolean) {
    const existing = await resolveOrderForUser(orderKey, userId);
    if (!existing) {
        return null;
    }
    if (includeXml) {
        return existing.toObject();
    }
    return OrderModel.findById(existing._id).select("-orderXml").lean().exec();
}

export async function getOrderXmlString(userId: string, orderKey: string) {
    const existing = await resolveOrderForUser(orderKey, userId);
    if (!existing?.orderXml) {
        return null;
    }
    return existing.orderXml as string;
}
