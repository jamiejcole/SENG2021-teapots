import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../utils/auth.utils";
import { HttpError } from "../errors/HttpError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new HttpError(401, "Missing authorization header");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      throw new HttpError(
        401,
        "Invalid authorization header format"
      );
    }

    const token = parts[1];

    try {
      const payload = verifyToken(token);

      // Check if 2FA is verified
      if (!payload.twoFactorVerified) {
        throw new HttpError(
          403,
          "Two-factor authentication not yet verified"
        );
      }

      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(401, "Invalid or expired token");
    }
  } catch (error) {
    next(error);
  }
}

export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(" ");
      if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        try {
          const token = parts[1];
          const payload = verifyToken(token);
          req.user = payload;
        } catch {
          // Silently ignore auth errors for optional middleware
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
