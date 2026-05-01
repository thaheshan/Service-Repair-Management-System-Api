import type { Request, Response } from "express";
import {
  createTenantUser,
  deleteTenantUser,
  getTenantUserById,
  getTenantUsers,
  updateTenantUser,
} from "@/services/user/user.service";
import type { AuthRequest } from "@/types/auth.types";

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getTenantUsers(req.user!.tenantId);
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to fetch users" });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await getTenantUserById(id, req.user!.tenantId);
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to fetch user" });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role, shopId, fullName } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "email and password are required" });
    const user = await createTenantUser(req.user!.tenantId, { email, password, role, shopId, fullName });
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to create user" });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { email, role, isActive, shopId } = req.body;
    const user = await updateTenantUser(id, req.user!.tenantId, { email, role, isActive, shopId });
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to update user" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteTenantUser(id, req.user!.tenantId);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    res.status(error.status ?? 500).json({ success: false, message: error.message ?? "Failed to delete user" });
  }
};