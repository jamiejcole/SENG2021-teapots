import { Request, Response } from "express";
import { HttpError } from "../../../errors/HttpError";
import { OrderModel } from "../../../models/order.model";

const DAILY_REQUEST_LIMIT = 10;

// In-memory rate-limit map: userId -> { count, date }
const rateLimitMap = new Map<string, { count: number; date: string }>();

function todayString(): string {
    return new Date().toISOString().slice(0, 10);
}

function getRemainingRequests(userId: string): number {
    const today = todayString();
    const entry = rateLimitMap.get(userId);
    if (!entry || entry.date !== today) return DAILY_REQUEST_LIMIT;
    return Math.max(0, DAILY_REQUEST_LIMIT - entry.count);
}

function incrementRequestCount(userId: string): void {
    const today = todayString();
    const entry = rateLimitMap.get(userId);
    if (!entry || entry.date !== today) {
        rateLimitMap.set(userId, { count: 1, date: today });
    } else {
        entry.count += 1;
    }
}

function requireUserId(req: Request): string {
    const uid = req.user?.userId;
    if (!uid) throw new HttpError(401, "Authentication required");
    return uid;
}

function formatOrderSummaryLine(order: any): string {
    const orderId = order.orderId || String(order._id);
    const buyer = order.buyer?.name ?? "Unknown Buyer";
    const seller = order.seller?.name ?? "Unknown Seller";
    const currency = order.currency ?? "AUD";
    const total = order.totals?.payableAmount ?? 0;
    const lineCount = Array.isArray(order.lines) ? order.lines.length : 0;
    return `Order ${orderId}: ${buyer} purchasing from ${seller} — ${lineCount} line(s), total ${currency} ${total}.`;
}

export async function generateSummary(req: Request, res: Response) {
    const userId = requireUserId(req);

    const remaining = getRemainingRequests(userId);
    if (remaining <= 0) {
        throw new HttpError(429, "Daily AI rate limit reached.");
    }

    const body = req.body ?? {};
    const orderIds: string[] | undefined = Array.isArray(body.orderIds) ? body.orderIds : undefined;
    const lineLength: number = typeof body.lineLength === "number" ? Math.min(Math.max(1, body.lineLength), 10) : 3;

    let orders;
    if (orderIds && orderIds.length > 0) {
        orders = await OrderModel.find({ userId, orderId: { $in: orderIds } }).lean().exec();
    } else {
        orders = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    }

    if (orders.length === 0) {
        incrementRequestCount(userId);
        return res.status(200).json({
            summary: "No orders found.",
            remainingDailyRequests: getRemainingRequests(userId),
        });
    }

    const lines = orders.slice(0, lineLength).map(formatOrderSummaryLine);
    const summary = lines.join(" ");

    incrementRequestCount(userId);

    return res.status(200).json({
        summary,
        remainingDailyRequests: getRemainingRequests(userId),
    });
}
