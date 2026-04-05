import { env } from "@/config/env";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

export type JwtRole = "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";

export type AccessTokenClaims = {
  sub: string;
  email: string;
  role: JwtRole;
  tenantId: string;
  shopId: string | null;
};

export type RefreshTokenClaims = {
  sub: string;
  jti: string;
};

export function signAccessToken(claims: AccessTokenClaims): string {
  const options: SignOptions = {
    issuer: env.JWT_ISSUER,
    expiresIn: env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
  };

  return jwt.sign(claims, env.ACCESS_TOKEN_SECRET, options);
}

export function signRefreshToken(claims: RefreshTokenClaims): string {
  const options: SignOptions = {
    issuer: env.JWT_ISSUER,
    expiresIn: env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
  };

  return jwt.sign(claims, env.REFRESH_TOKEN_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET, { issuer: env.JWT_ISSUER }) as JwtPayload;

  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
    role: decoded.role as JwtRole,
    tenantId: String(decoded.tenantId),
    shopId: decoded.shopId === null || decoded.shopId === undefined ? null : String(decoded.shopId),
  };
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET, { issuer: env.JWT_ISSUER }) as JwtPayload;

  return {
    sub: String(decoded.sub),
    jti: String(decoded.jti),
  };
}
