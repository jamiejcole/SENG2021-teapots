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

export const errorMiddleware = (
    err: any, 
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    const status = err instanceof HttpError ? err.statusCode : 500;
    
    console.error("--- ERROR OCCURRED ---");
    console.error(`Status: ${status}`);
    console.error(err.stack); 
    console.error("----------------------");

    res.status(status).json({
        error: getStatusName(status),
        message: err.message || "An unexpected error occurred",
    });
};