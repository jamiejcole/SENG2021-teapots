import { Request, Response, NextFunction } from "express";

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers["x-api-key"];
  const key = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const expected = process.env.BACKEND_API_KEY?.trim();
  if (!expected || !key || key !== expected) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or missing API key" });
    return;
  }
  next();
}
