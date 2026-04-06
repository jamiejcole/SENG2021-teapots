import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";

const REQUEST_ID_HEADERS = ["x-request-id", "x-correlation-id"] as const;

function getIncomingRequestId(req: Request): string | undefined {
  for (const headerName of REQUEST_ID_HEADERS) {
    const headerValue = req.headers[headerName];
    if (typeof headerValue === "string" && headerValue.trim()) {
      return headerValue.trim();
    }
  }

  return undefined;
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = getIncomingRequestId(req) ?? randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}
