import { prisma } from "@/db/prisma";
import { Request, Response } from "express";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, isActive: true, tenantId: true, shopId: true, createdAt: true, updatedAt: true },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users", error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true, tenantId: true, shopId: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user", error });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role, tenantId, shopId } = req.body;
    if (!email || !password || !tenantId)
      return res.status(400).json({ success: false, message: "email, password and tenantId are required" });
    const user = await prisma.user.create({
      data: { email, password, role, tenantId, shopId },
      select: { id: true, email: true, role: true, isActive: true, tenantId: true, shopId: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    if (error.code === "P2002") return res.status(409).json({ success: false, message: "Email already exists" });
    res.status(500).json({ success: false, message: "Failed to create user", error });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { email, role, isActive, shopId } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { email, role, isActive, shopId },
      select: { id: true, email: true, role: true, isActive: true, shopId: true, updatedAt: true },
    });
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "User not found" });
    res.status(500).json({ success: false, message: "Failed to update user", error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "User not found" });
    res.status(500).json({ success: false, message: "Failed to delete user", error });
  }
};