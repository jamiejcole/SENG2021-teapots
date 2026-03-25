import UserModel from "../../../models/user.model";
import {
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  generateTwoFactorCode,
  generateTwoFactorExpiry,
  isTwoFactorCodeExpired,
  verifyToken,
  JWTPayload,
} from "../../../utils/auth.utils";
import { sendTwoFactorCode } from "../../../utils/mailgun.service";
import { HttpError } from "../../../errors/HttpError";

export async function signupUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  // Validate input
  if (!email || !password || !firstName || !lastName) {
    throw new HttpError(400, "All fields are required");
  }

  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }

  // Check if user already exists
  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new HttpError(400, "User already exists with this email");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate 2FA code
  const twoFactorCode = generateTwoFactorCode();
  const expiresAt = generateTwoFactorExpiry();

  // Create new user
  const newUser = new UserModel({
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName,
    lastName,
    twoFactor: {
      code: twoFactorCode,
      expiresAt,
      isVerified: false,
    },
  });

  const savedUser = await newUser.save();

  // Send 2FA code via email
  try {
    await sendTwoFactorCode(
      savedUser.email,
      twoFactorCode,
      savedUser.firstName
    );
  } catch (error) {
    // Delete user if email fails
    await UserModel.findByIdAndDelete(savedUser._id);
    throw error;
  }

  return {
    userId: savedUser._id.toString(),
    email: savedUser.email,
    message: "Signup successful. Check your email for 2FA verification code.",
  };
}

export async function loginUser(email: string, password: string) {
  // Validate input
  if (!email || !password) {
    throw new HttpError(400, "Email and password are required");
  }

  // Find user
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  // Verify password
  const passwordMatch = await comparePasswords(password, user.password);
  if (!passwordMatch) {
    throw new HttpError(401, "Invalid email or password");
  }

  // 2FA is only required at signup. If the account was never verified, block login.
  if (!user.twoFactor?.isVerified) {
    throw new HttpError(403, "Please complete signup 2FA verification before signing in");
  }

  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    twoFactorVerified: true,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    message: "Login successful",
  };
}

export async function verify2FACode(userId: string, code: string) {
  // Validate input
  if (!userId || !code) {
    throw new HttpError(400, "userId and code are required");
  }

  if (code.length !== 6 || !/^\d+$/.test(code)) {
    throw new HttpError(400, "Code must be a 6-digit number");
  }

  // Find user
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new HttpError(401, "Invalid user");
  }

  // Verify 2FA code
  if (!user.twoFactor.code || user.twoFactor.code !== code) {
    throw new HttpError(400, "Invalid 2FA code");
  }

  // Check if code expired
  if (isTwoFactorCodeExpired(user.twoFactor.expiresAt)) {
    throw new HttpError(400, "2FA code has expired");
  }

  // Mark as verified
  user.twoFactor.isVerified = true;
  user.twoFactor.code = null;
  user.twoFactor.expiresAt = null;
  await user.save();

  // Generate tokens
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    twoFactorVerified: true,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    message: "2FA verification successful",
  };
}

export async function refreshAccessToken(refreshToken: string) {
  // Validate input
  if (!refreshToken) {
    throw new HttpError(400, "Refresh token is required");
  }

  try {
    // Verify refresh token
    const payload = verifyToken(refreshToken);

    // Find user
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      throw new HttpError(401, "User not found");
    }

    // Generate new access token
    const newPayload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      twoFactorVerified: true,
    };

    const accessToken = generateAccessToken(newPayload);

    return {
      accessToken,
      message: "Access token refreshed",
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(401, "Invalid refresh token");
  }
}
