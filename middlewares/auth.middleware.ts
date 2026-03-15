import { verifyAccessTokenString, type AccessTokenClaims, type JwtRole } from "@/utils/jwt.util";
import { NextFunction, Request, Response } from "express";

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenClaims;
}

export const verifyAccessToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing access token" });
    }

    req.user = verifyAccessTokenString(token);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired access token" });
  }
};

export const requireRoles = (...roles: JwtRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    return next();
  };
};
