import { Request, Response } from "express";
import { HttpError } from "../../../errors/HttpError";
import * as service from "./despatch.service";

function requireUserId(req: Request): string {
    const uid = req.user?.userId;
    if (!uid) throw new HttpError(401, "Authentication required");
    return uid;
}

export async function createDespatch(req: Request, res: Response) {
    const userId = requireUserId(req);
    const orderXml = req.body;

    if (!orderXml || typeof orderXml !== "string" || !orderXml.trim()) {
        throw new HttpError(400, "Request body must be a non-empty XML string");
    }

    console.log(`[despatch] Creating despatch advice for user ${userId}`);

    const result = await service.createDespatchAdvice(orderXml, userId);

    res.status(200).json({
        success: true,
        adviceIds: [result.adviceId],
        "executed-at": result.executedAt,
    });
}

export async function retrieveDespatch(req: Request, res: Response) {
    const userId = requireUserId(req);
    const searchType = req.query["search-type"] as string | undefined;
    const query = req.query["query"] as string | undefined;

    if (!searchType || !query) {
        throw new HttpError(400, "Missing required query parameters: 'search-type' and 'query'");
    }

    if (searchType !== "advice-id" && searchType !== "order") {
        throw new HttpError(400, "Invalid 'search-type'. Must be 'advice-id' or 'order'");
    }

    let record;
    if (searchType === "advice-id") {
        record = await service.getDespatchAdviceByAdviceId(query, userId);
    } else {
        record = await service.getDespatchAdviceByOrderXml(query, userId);
    }

    if (!record) {
        throw new HttpError(404, "Despatch advice not found");
    }

    res.status(200).json({
        "despatch-advice": record.despatchAdviceXml,
        "advice-id": record.adviceId,
        "executed-at": record.executedAt,
    });
}

export async function listDespatch(req: Request, res: Response) {
    const userId = requireUserId(req);
    const records = await service.listDespatchAdvices(userId);

    res.status(200).json({
        results: records.map((r) => ({
            "advice-id": r.adviceId,
            "executed-at": r.executedAt,
            "despatch-advice": r.despatchAdviceXml,
        })),
        "executed-at": Math.floor(Date.now() / 1000),
    });
}

export async function cancelOrder(req: Request, res: Response) {
    const userId = requireUserId(req);
    const adviceId = req.body["advice-id"];
    const cancellationDocument = req.body["order-cancellation-document"];

    if (!adviceId || typeof adviceId !== "string") {
        throw new HttpError(400, "Request body must include 'advice-id' as a non-empty string");
    }

    if (!cancellationDocument || typeof cancellationDocument !== "string") {
        throw new HttpError(400, "Request body must include 'order-cancellation-document' as a non-empty string");
    }

    console.log(`[despatch] Cancelling order for advice ${adviceId}, user ${userId}`);

    const cancellation = await service.createOrderCancellation(adviceId, userId, cancellationDocument);

    if (!cancellation) {
        throw new HttpError(404, "Despatch advice not found");
    }

    res.status(200).json({
        "order-cancellation": cancellation.cancellationDocument,
        "order-cancellation-reason": cancellation.cancellationReason,
        "order-cancellation-id": cancellation.cancellationId,
        "advice-id": cancellation.adviceId,
        "executed-at": cancellation.executedAt,
    });
}

export async function getOrderCancellation(req: Request, res: Response) {
    const userId = requireUserId(req);
    const adviceId = req.query["advice-id"] as string | undefined;
    const cancellationId = req.query["cancellation-id"] as string | undefined;

    if (!adviceId && !cancellationId) {
        throw new HttpError(400, "At least one of 'advice-id' or 'cancellation-id' is required");
    }

    const cancellation = await service.getOrderCancellation(userId, adviceId, cancellationId);

    if (!cancellation) {
        throw new HttpError(404, "Order cancellation not found");
    }

    res.status(200).json({
        "order-cancellation": cancellation.cancellationDocument,
        "order-cancellation-reason": cancellation.cancellationReason,
        "order-cancellation-id": cancellation.cancellationId,
        "advice-id": cancellation.adviceId,
        "executed-at": cancellation.executedAt,
    });
}

export async function cancelFulfilment(req: Request, res: Response) {
    const userId = requireUserId(req);
    const adviceId = req.body["advice-id"];
    const reason = req.body["fulfilment-cancellation-reason"];

    if (!adviceId || typeof adviceId !== "string") {
        throw new HttpError(400, "Request body must include 'advice-id' as a non-empty string");
    }

    if (!reason || typeof reason !== "string") {
        throw new HttpError(400, "Request body must include 'fulfilment-cancellation-reason' as a non-empty string");
    }

    console.log(`[despatch] Creating fulfilment cancellation for advice ${adviceId}, user ${userId}`);

    const cancellation = await service.createFulfilmentCancellation(adviceId, userId, reason);

    if (!cancellation) {
        throw new HttpError(404, "Despatch advice not found");
    }

    res.status(200).json({
        "fulfilment-cancellation": cancellation.fulfilmentCancellationXml,
        "fulfilment-cancellation-reason": cancellation.cancellationReason,
        "fulfilment-cancellation-id": cancellation.fulfilmentCancellationId,
        "advice-id": cancellation.adviceId,
        "executed-at": cancellation.executedAt,
    });
}

export async function getFulfilmentCancellation(req: Request, res: Response) {
    const userId = requireUserId(req);
    const adviceId = req.query["advice-id"] as string | undefined;
    const fulfilmentCancellationId = req.query["fulfilment-cancellation-id"] as string | undefined;

    if (!adviceId && !fulfilmentCancellationId) {
        throw new HttpError(400, "At least one of 'advice-id' or 'fulfilment-cancellation-id' is required");
    }

    const cancellation = await service.getFulfilmentCancellation(userId, adviceId, fulfilmentCancellationId);

    if (!cancellation) {
        throw new HttpError(404, "Fulfilment cancellation not found");
    }

    res.status(200).json({
        "fulfilment-cancellation": cancellation.fulfilmentCancellationXml,
        "fulfilment-cancellation-reason": cancellation.cancellationReason,
        "fulfilment-cancellation-id": cancellation.fulfilmentCancellationId,
        "advice-id": cancellation.adviceId,
        "executed-at": cancellation.executedAt,
    });
}
