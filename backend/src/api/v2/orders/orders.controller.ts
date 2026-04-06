import { Request, Response } from "express";
import { HttpError } from "../../../errors/HttpError";
import { validateUBL } from "../invoices/invoices.validation";
import { asyncHandler } from "../../../utils/asyncHandler";
import { buildOrderFromPayload } from "../../../domain/OrderUblBuilder";
import type { CreateOrderPayload } from "../../../types/order.dto";
import { assertCreateOrderPayload } from "./orders.validation";
import * as service from "./orders.service";

function requireUserId(req: Request): string {
    const uid = req.user?.userId;
    if (!uid) throw new HttpError(401, "Authentication required");
    return uid;
}

function orderKeyParam(param: string | string[] | undefined): string {
    if (typeof param === "string" && param) return param;
    if (Array.isArray(param) && param[0]) return param[0];
    return "";
}

export const validateOrder = asyncHandler(async (req: Request, res: Response) => {
    if (req.body?.orderXml && typeof req.body.orderXml === "string" && req.body.orderXml.trim()) {
        validateUBL(req.body.orderXml.trim(), "Order");
        return res.status(200).json({ message: "UBL Order is valid!" });
    }
    assertCreateOrderPayload(req.body);
    const { orderXml } = buildOrderFromPayload(req.body as CreateOrderPayload);
    validateUBL(orderXml.trim(), "Order");
    res.status(200).json({ message: "Order payload is valid UBL." });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const rows = await service.listOrdersForUser(userId);
    res.status(200).json({ orders: rows });
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const doc = await service.createOrderFromPayload(userId, req.body);
    const { orderXml, ...rest } = doc as Record<string, unknown>;
    res.status(201).json(rest);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const key = orderKeyParam(req.params.orderKey);
    if (!key) throw new HttpError(400, "orderKey required");
    const doc = await service.getOrderDetail(userId, key, false);
    if (!doc) throw new HttpError(404, "Order not found");
    res.status(200).json(doc);
});

export const getOrderXml = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const key = orderKeyParam(req.params.orderKey);
    if (!key) throw new HttpError(400, "orderKey required");
    const xml = await service.getOrderXmlString(userId, key);
    if (!xml) throw new HttpError(404, "Order not found");
    res.contentType("application/xml");
    res.status(200).send(xml);
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const key = orderKeyParam(req.params.orderKey);
    if (!key) throw new HttpError(400, "orderKey required");
    const doc = await service.updateOrderFromPayload(userId, key, req.body);
    if (!doc) throw new HttpError(404, "Order not found");
    res.status(200).json(doc);
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const key = orderKeyParam(req.params.orderKey);
    if (!key) throw new HttpError(400, "orderKey required");
    const result = await service.deleteOrderForUser(userId, key);
    if (!result) throw new HttpError(404, "Order not found");
    res.status(204).send();
});
