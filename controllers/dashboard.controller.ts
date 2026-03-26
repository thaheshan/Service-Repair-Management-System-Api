import type { Response } from "express";
import type { AuthRequest } from "@/types/auth.types";
import { countPendingRepairs } from "@/services/dashboard/dashboard.service";

export async function getPendingRepairs(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const pendingRepairs = await countPendingRepairs({
      tenantId: user.tenantId,
      role: user.role,
      userId: user.id,
    });

    return res.status(200).json({ pendingRepairs });
  } catch {
    return res.status(500).json({ error: "Unable to fetch pending repairs" });
  }
}

