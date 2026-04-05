import UserModel from "../../../models/user.model";
import { sha256 } from "../../../models/hash";
import {
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  generateTwoFactorCode,
  generateTwoFactorExpiry,
  isTwoFactorCodeExpired,
  verifyToken,
  generatePasswordResetToken,
  generatePasswordResetExpiry,
  isPasswordResetTokenExpired,
  JWTPayload,
} from "../../../utils/auth.utils";
import { sendTwoFactorCode, sendPasswordResetEmail } from "../../../utils/mailgun.service";
import { HttpError } from "../../../errors/HttpError";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;

function getPublicAppUrl() {
  return (process.env.PUBLIC_APP_URL || "https://teapotinvoicing.app").replace(/\/$/, "");
}

function buildPasswordResetLink(token: string) {
  return `${getPublicAppUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

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

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
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
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    company: user.company,
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

export async function getUserProfile(userId: string) {
  // Validate input
  if (!userId) {
    throw new HttpError(400, "User ID is required");
  }

  // Find user
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    company: user.company,
    message: "User profile retrieved successfully",
  };
}

export async function updateUserProfile(
  userId: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  company?: string
) {
  // Validate input
  if (!userId) {
    throw new HttpError(400, "User ID is required");
  }

  // Find user
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  // Update fields if provided
  if (firstName !== undefined && firstName.trim()) {
    user.firstName = firstName.trim();
  }
  if (lastName !== undefined && lastName.trim()) {
    user.lastName = lastName.trim();
  }
  if (phone !== undefined) {
    user.phone = phone.trim() || null;
  }
  if (company !== undefined) {
    user.company = company.trim() || null;
  }

  // Save updated user
  const updatedUser = await user.save();

  return {
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    phone: updatedUser.phone,
    company: updatedUser.company,
    message: "Profile updated successfully",
  };
}

export async function requestPasswordReset(email: string) {
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new HttpError(400, "Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      message: "If an account exists, a password reset link has been sent.",
    };
  }

  const resetToken = generatePasswordResetToken();
  const resetTokenHash = sha256(resetToken);
  const expiresAt = generatePasswordResetExpiry();

  user.passwordReset = {
    tokenHash: resetTokenHash,
    expiresAt,
  };

  await user.save();

  try {
    await sendPasswordResetEmail(user.email, {
      firstName: user.firstName,
      resetLink: buildPasswordResetLink(resetToken),
      expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
    });
  } catch (error) {
    user.passwordReset = {
      tokenHash: null,
      expiresAt: null,
    };
    await user.save();
    throw error;
  }

  return {
    message: "If an account exists, a password reset link has been sent.",
  };
}

export async function resetPassword(token: string, password: string) {
  if (!token || typeof token !== "string" || !token.trim()) {
    throw new HttpError(400, "Reset token is required");
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    throw new HttpError(400, "Password is required");
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  const tokenHash = sha256(token.trim());
  const user = await UserModel.findOne({ "passwordReset.tokenHash": tokenHash });

  if (!user || isPasswordResetTokenExpired(user.passwordReset?.expiresAt)) {
    throw new HttpError(400, "Invalid or expired password reset link");
  }

  user.password = await hashPassword(password);
  user.passwordReset = {
    tokenHash: null,
    expiresAt: null,
  };

  await user.save();

  return {
    message: "Password reset successful",
  };
}
