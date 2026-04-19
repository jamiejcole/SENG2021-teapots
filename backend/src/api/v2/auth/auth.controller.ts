import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import * as authService from "./auth.service";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  const result = await authService.signupUser(email, password, firstName, lastName);

  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  res.status(200).json(result);
});

export const verify2FA = asyncHandler(async (req: Request, res: Response) => {
  const { userId, code } = req.body;

  const result = await authService.verify2FACode(userId, code);

  res.status(200).json(result);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json(result);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const result = await authService.getUserProfile(req.user.userId);

  res.status(200).json(result);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { firstName, lastName, phone, company, businessAddress } = req.body;
  const result =
    businessAddress !== undefined
      ? await authService.updateUserProfile(req.user.userId, firstName, lastName, phone, company, businessAddress)
      : await authService.updateUserProfile(req.user.userId, firstName, lastName, phone, company);

  res.status(200).json(result);
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.requestPasswordReset(email);

  res.status(200).json(result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);

  res.status(200).json(result);
});
