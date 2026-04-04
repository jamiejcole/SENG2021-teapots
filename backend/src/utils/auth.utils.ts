import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_ACCESS_TOKEN_EXPIRES_IN = (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"] | undefined) ?? "7d";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES = 60;

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

// JWT tokens
export interface JWTPayload {
  userId: string;
  email: string;
  twoFactorVerified: boolean;
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// 2FA code generation
export function generateTwoFactorCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateTwoFactorExpiry(): Date {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10); // 10-minute expiry
  return expiryTime;
}

export function isTwoFactorCodeExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generatePasswordResetExpiry(): Date {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES);
  return expiryTime;
}

export function isPasswordResetTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}
