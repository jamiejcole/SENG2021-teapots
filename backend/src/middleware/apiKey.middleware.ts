import { Request, Response, NextFunction } from "express";

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"];
  if (!process.env.BACKEND_API_KEY || key !== process.env.BACKEND_API_KEY) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or missing API key" });
    return;
  }
  next();
}
