import { NextFunction, Request, Response } from "express";

type LogPayload = {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string;
};

const writeLog = (_payload: LogPayload): void => {
  console.log(`* Incoming request: ${_payload.method}, ${_payload.path}`);
};

const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    if (isTestEnvironment) return;

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