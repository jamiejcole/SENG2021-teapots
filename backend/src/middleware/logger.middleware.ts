import { NextFunction, Request, Response } from "express";

type LogPayload = {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string;
};

const writeLog = (payload: LogPayload): void => {
  console.log("* Incoming request:", payload);
};

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    writeLog({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip ?? "null",
    });
  });

  next();
};