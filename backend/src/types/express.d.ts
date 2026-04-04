import { JWTPayload } from "../utils/auth.utils";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: JWTPayload;
    }
  }
}

export {};
