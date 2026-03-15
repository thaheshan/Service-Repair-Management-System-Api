import { env } from "@/config/env";
import jwt from "jsonwebtoken";

export type JwtRole = "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";

export interface AccessTokenClaims {
  user_id: string;
  role: JwtRole;
  shop_id: string | null;
  tenant_id: string;
}

export const signAccessToken = (claims: AccessTokenClaims): string => {
  return jwt.sign(claims, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
    issuer: env.JWT_ISSUER,
  });
};

export const verifyAccessTokenString = (token: string): AccessTokenClaims => {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
    issuer: env.JWT_ISSUER,
  });

  return decoded as AccessTokenClaims;
};
