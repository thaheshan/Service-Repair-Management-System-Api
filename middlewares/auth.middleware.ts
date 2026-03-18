import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/utils/jwt.util";

type AuthUser = {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";
  tenantId: string;
  shopId: string | null;
};

type AuthenticatedRequest = Request & { user?: AuthUser };

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization header missing or malformed" });
  }

  const token = header.split(" ")[1];

  try {
    const claims = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: claims.sub,
      email: claims.email,
      role: claims.role,
      tenantId: claims.tenantId,
      shopId: claims.shopId,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function authorizeRoles(...roles: Array<AuthUser["role"]>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!roles.includes(authReq.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    return next();
  };
}

