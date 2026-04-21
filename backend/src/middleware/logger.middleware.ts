import { NextFunction, Request, Response } from "express";
import { parseForwardedFor } from "../utils/parseForwardedFor";

type ActorContext = {
  userId?: string;
  email?: string;
  twoFactorVerified?: boolean;
};

type LogPayload = {
  timestamp: string;
  level: string;
  event: string;
  requestId: string;
  method: string;
  path: string;
  route?: string;
  statusCode: number;
  durationMs: number;
  ip: string;
  forwardedFor?: string;
  origin?: string;
  userAgent?: string;
  actor?: ActorContext;
};

const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

const writeLog = (payload: LogPayload): void => {
  console.log(JSON.stringify(payload));
};

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    if (isTestEnvironment) return;

    const routePath = req.route?.path;
    const route = typeof routePath === "string" ? `${req.baseUrl}${routePath}` : undefined;
    const actor = req.user
      ? {
          userId: req.user.userId,
          email: req.user.email,
          twoFactorVerified: req.user.twoFactorVerified,
        }
      : undefined;

    writeLog({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "http_request",
      requestId: req.requestId ?? "unknown",
      method: req.method,
      path: req.originalUrl,
      route,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip ?? "null",
      forwardedFor: parseForwardedFor(req.headers["x-forwarded-for"]),
      origin: req.headers.origin,
      userAgent: req.get("user-agent") ?? undefined,
      actor,
    });
  });

  next();
};