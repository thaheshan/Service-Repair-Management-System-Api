import { prisma } from "@/db/prisma";
import { sendVerificationEmail } from "@/services/email.service";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

// BE-REG-01: POST /api/shop/generate-ids
export const generateShopIds = async (req: Request, res: Response) => {
  try {
    const { shop_name, owner_email } = req.body;

    if (!shop_name || !owner_email) {
      return res.status(400).json({ success: false, message: "shop_name and owner_email are required" });
    }

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email: owner_email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Generate unique IDs
    const shop_id = uuidv4();
    const tenant_id = uuidv4();

    // Validate uniqueness against DB
    const existingTenant = await prisma.tenant.findUnique({ where: { id: tenant_id } });
    const existingShop = await prisma.shop.findUnique({ where: { id: shop_id } });

    if (existingTenant || existingShop) {
      return res.status(400).json({ success: false, message: "ID collision detected, please retry" });
    }

    res.status(200).json({
      success: true,
      data: { shop_id, tenant_id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unexpected failure", error });
  }
};

// BE-REG-02: POST /api/shop/register
export const registerShop = async (req: Request, res: Response) => {
  try {
    const { shop_id, tenant_id, shop_name, brn, owner } = req.body;
    if (!shop_id || !tenant_id || !shop_name || !owner?.name || !owner?.email || !owner?.password) {
        return res.status(400).json({ success: false, message: "shop_id, tenant_id, shop_name and owner details are required" });
    }

    const hashedPassword = await bcrypt.hash(owner.password, 10);

    // Atomic transaction - create Tenant, Shop and Owner User together
    const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
        data: { id: tenant_id, name: shop_name }, // ← use shop_name
    });

    const shop = await tx.shop.create({
        data: { id: shop_id, tenantId: tenant_id, name: shop_name, brn },
     });

    const user = await tx.user.create({
        data: {
        tenantId: tenant_id,
        shopId: shop_id,
        email: owner.email,
        password: hashedPassword,
        role: "ADMIN",
        },
        select: { id: true, email: true, role: true, tenantId: true, shopId: true },
    });

    return { tenant, shop, user };
    });

    // Send verification email after successful transaction
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: { userId: result.user.id, token, expiresAt },
    });

    try {
      await sendVerificationEmail(result.user.id, owner.email, token);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: result,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    res.status(500).json({ success: false, message: "Failed transaction", error });
  }
};

// BE-REG-03: POST /api/user/send-verification
export const sendVerification = async (req: Request, res: Response) => {
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ success: false, message: "user_id and email are required" });
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Invalidate old tokens
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user_id, used: false },
      data: { used: true },
    });

    // Create new token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: { userId: user_id, token, expiresAt },
    });

    await sendVerificationEmail(user_id, email, token);

    res.status(200).json({ success: true, message: "Verification email sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Email delivery failed", error });
  }
};