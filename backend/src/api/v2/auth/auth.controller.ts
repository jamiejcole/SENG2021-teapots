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
