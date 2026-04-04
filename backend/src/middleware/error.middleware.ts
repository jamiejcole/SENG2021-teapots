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
            message: "Request failed",
            status,
            method: req.method,
            path: req.originalUrl,
            error: err?.message ?? "An unexpected error occurred",
            stack: err?.stack,
        }));
    }

    res.status(status).json({
        error: getStatusName(status),
        message: err.message || "An unexpected error occurred",
    });
};