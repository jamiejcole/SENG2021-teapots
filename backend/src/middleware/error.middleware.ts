/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/HttpError";

const getStatusName = (code: number): string => {
    const map: Record<number, string> = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        500: "Internal Server Error"
    };
    return map[code] || "Error";
};

const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

const parseForwardedFor = (value: string | string[] | undefined): string | undefined => {
    if (typeof value === "string" && value.trim()) {
        return value.split(",")[0].trim();
    }

    if (Array.isArray(value) && value.length > 0) {
        return value[0].split(",")[0].trim();
    }

    return undefined;
};

export const errorMiddleware = (
    err: any, 
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    const status = err instanceof HttpError ? err.statusCode : 500;

    if (!isTestEnvironment) {
        console.error(JSON.stringify({
            level: "error",
            event: "http_error",
            requestId: req.requestId ?? "unknown",
            status,
            method: req.method,
            path: req.originalUrl,
            route: typeof req.route?.path === "string" ? `${req.baseUrl}${req.route.path}` : undefined,
            ip: req.ip ?? "null",
            forwardedFor: parseForwardedFor(req.headers["x-forwarded-for"]),
            origin: req.headers.origin,
            userAgent: req.get("user-agent") ?? undefined,
            actor: req.user
                ? {
                    userId: req.user.userId,
                    email: req.user.email,
                    twoFactorVerified: req.user.twoFactorVerified,
                }
                : undefined,
            error: err?.message ?? "An unexpected error occurred",
            stack: err?.stack,
        }));
    }

    res.status(status).json({
        error: getStatusName(status),
        message: err.message || "An unexpected error occurred",
    });
};