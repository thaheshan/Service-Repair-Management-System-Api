import { env } from "@/config/env";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export type JwtRole = "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";

export interface AccessTokenClaims {
  user_id: string;
  role: JwtRole;
  shop_id: string | null;
  tenant_id: string;
}

export const signAccessToken = (claims: AccessTokenClaims): string => {
  const secret: Secret = env.ACCESS_TOKEN_SECRET;
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
    issuer: env.JWT_ISSUER,
  };

  return jwt.sign(claims, secret, options);
};

export const verifyAccessTokenString = (token: string): AccessTokenClaims => {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
    issuer: env.JWT_ISSUER,
  });

  return decoded as AccessTokenClaims;
};
