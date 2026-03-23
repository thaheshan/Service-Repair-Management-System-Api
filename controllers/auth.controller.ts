import type { Request, Response } from "express";
import {
  createInitialAdminUser,
  getCurrentUser,
  loginUser,
  logoutSession,
  refreshSession,
} from "@/services/auth/auth.service";
import type { AuthRequest } from "@/types/auth.types";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "email and password are required" });
  }

  try {
    const data = await loginUser(email, password);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "refreshToken is required" });
  }

  try {
    const data = await refreshSession(refreshToken);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "refreshToken is required" });
  }

  try {
    await logoutSession(refreshToken);
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const data = await getCurrentUser(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};

export const createInitialAdmin = async (req: Request, res: Response) => {
  const { email, password, tenantName } = req.body as { email?: string; password?: string; tenantName?: string };
  if (!email || !password || !tenantName) {
    return res.status(400).json({ success: false, message: "email, password and tenantName are required" });
  }

  try {
    const data = await createInitialAdminUser(email, password, tenantName);
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({
      success: false,
      message: error.message ?? "Unexpected failure",
    });
  }
};

