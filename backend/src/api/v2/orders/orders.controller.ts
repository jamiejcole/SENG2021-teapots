import { Request, Response } from "express";
import { HttpError } from "../../../errors/HttpError";
import { validateUBL } from "../invoices/invoices.validation";
import * as service from "./orders.service";

function requireUserId(req: Request): string {
    const uid = req.user?.userId;
    if (!uid) throw new HttpError(401, "Authentication required");
    return uid;
}

function mongoIdParam(param: string | string[] | undefined): string {
    if (typeof param === "string" && param) return param;
    if (Array.isArray(param) && param[0]) return param[0];
    return "";
}

export async function validateOrder(req: Request, res: Response) {
    const { orderXml } = req.body;

    if (!orderXml || typeof orderXml !== "string" || !orderXml.trim()) {
        throw new HttpError(400, "Request body must include 'orderXml' as a non-empty string");
    }

    res.contentType("application/json");

    validateUBL(orderXml, "Order");

    res.status(200).json({
        message: "UBL Order is valid!",
    });
}

export async function createOrder(req: Request, res: Response) {
    const userId = requireUserId(req);
    const { data } = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new HttpError(400, "Request body must include 'data' as a non-empty object");
    }

    const doc = await service.createOrder(data, userId);
    const orderId = String(doc._id);

    console.log(`[orders] Created order ${orderId} for user ${userId}`);

    res.status(201).json({
        orderId,
        status: "success",
        ublXmlUrl: `/api/v2/orders/${orderId}/xml`,
    });
}

export async function listOrders(req: Request, res: Response) {
    const userId = requireUserId(req);
    const orders = await service.listOrdersForUser(userId);
    res.status(200).json(orders);
}

export async function getOrder(req: Request, res: Response) {
    const userId = requireUserId(req);
    const orderId = mongoIdParam(req.params.orderId);

    if (!orderId) {
        throw new HttpError(400, "Order ID is required");
    }

    const order = await service.getOrderById(orderId, userId);

    if (!order) {
        throw new HttpError(404, "Order not found");
    }

    res.status(200).json(order);
}

export async function updateOrder(req: Request, res: Response) {
    const userId = requireUserId(req);
    const orderId = mongoIdParam(req.params.orderId);

    if (!orderId) {
        throw new HttpError(400, "Order ID is required");
    }

    const { data } = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new HttpError(400, "Request body must include 'data' as a non-empty object");
    }

    const updated = await service.updateOrder(orderId, userId, data);

    if (!updated) {
        throw new HttpError(404, "Order not found");
    }

    console.log(`[orders] Updated order ${orderId} for user ${userId}`);

    res.status(200).json({
        orderId,
        status: "success",
        ublXmlUrl: `/api/v2/orders/${orderId}/xml`,
    });
}

export async function deleteOrder(req: Request, res: Response) {
    const userId = requireUserId(req);
    const orderId = mongoIdParam(req.params.orderId);

    if (!orderId) {
        throw new HttpError(400, "Order ID is required");
    }

    const deleted = await service.deleteOrder(orderId, userId);

    if (!deleted) {
        throw new HttpError(404, "Order not found");
    }

    console.log(`[orders] Deleted order ${orderId} for user ${userId}`);

    res.status(200).json({
        status: "deleted",
        message: "Order deleted successfully.",
    });
}

export async function getOrderXml(req: Request, res: Response) {
    const userId = requireUserId(req);
    const orderId = mongoIdParam(req.params.orderId);

    if (!orderId) {
        throw new HttpError(400, "Order ID is required");
    }

    const order = await service.getOrderById(orderId, userId);

    if (!order) {
        throw new HttpError(404, "Order not found");
    }

    res.set("Content-Type", "application/xml");
    res.status(200).send(order.orderXml);
}
