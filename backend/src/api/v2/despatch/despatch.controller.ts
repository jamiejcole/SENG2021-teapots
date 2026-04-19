import { Request, Response } from "express";
import { HttpError } from "../../../errors/HttpError";
import { asyncHandler } from "../../../utils/asyncHandler";
import * as service from "./despatch.service";

function requireUserId(req: Request): string {
    const uid = req.user?.userId;
    if (!uid) throw new HttpError(401, "Authentication required");
    return uid;
}

function paramStr(p: string | string[] | undefined): string {
    if (typeof p === "string" && p) return p;
    if (Array.isArray(p) && p[0]) return p[0];
    return "";
}

export const createDespatch = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const doc = await service.createDespatch(userId, req.body);
    res.status(201).json(doc);
});

export const listDespatch = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const activeOnly = req.query.active === "1" || req.query.active === "true";
    const rows = await service.listDespatches(userId, { activeOnly });
    res.status(200).json({ despatches: rows });
});

export const retrieveDespatch = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const id = paramStr(req.params.despatchId);
    if (!id) throw new HttpError(400, "despatchId required");
    const doc = await service.getDespatch(userId, id);
    if (!doc) throw new HttpError(404, "Despatch not found");
    res.status(200).json(doc);
});

export const cancelOrderPost = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const orderId = typeof req.body?.orderId === "string" ? req.body.orderId.trim() : "";
    if (!orderId) throw new HttpError(400, "orderId required");
    const doc = await service.cancelOrderForUser(userId, orderId);
    if (!doc) throw new HttpError(404, "Order not found");
    res.status(200).json(doc);
});

export const cancelOrderList = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const orders = await service.listCancelledOrders(userId);
    res.status(200).json({ orders });
});

export const cancelFulfilmentPost = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const despatchId = typeof req.body?.despatchId === "string" ? req.body.despatchId.trim() : "";
    if (!despatchId) throw new HttpError(400, "despatchId required");
    const doc = await service.cancelFulfilment(userId, despatchId);
    if (!doc) throw new HttpError(404, "Despatch not found");
    res.status(200).json(doc);
});

export const cancelFulfilmentList = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const despatches = await service.listFulfilmentCancelled(userId);
    res.status(200).json({ despatches });
});

export const deleteDespatch = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const id = paramStr(req.params.despatchId);
    if (!id) throw new HttpError(400, "despatchId required");
    const deleted = await service.deleteDespatchById(userId, id);
    if (!deleted) throw new HttpError(404, "Despatch not found");
    res.status(200).json({ message: "Despatch deleted" });
});

export const emailDespatch = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const despatchId = typeof req.body?.despatchId === "string" ? req.body.despatchId.trim() : "";
    const to = typeof req.body?.to === "string" ? req.body.to.trim() : "";
    if (!despatchId) throw new HttpError(400, "despatchId required");
    if (!to) throw new HttpError(400, "to required");
    if (!/^\S+@\S+\.\S+$/.test(to)) {
        throw new HttpError(400, "Invalid recipient email address");
    }
    const result = await service.emailDespatchAdviceForUser(userId, despatchId, to);
    res.status(200).json(result);
});
