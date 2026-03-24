import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "@/config/env";

export type AccessTokenClaims = {
  sub: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";
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
    expiresIn: env.ACCESS_TOKEN_EXPIRY as unknown as number,
  };
  return jwt.sign(claims, env.ACCESS_TOKEN_SECRET, options);
}

export function signRefreshToken(claims: RefreshTokenClaims): string {
  const options: SignOptions = {
    issuer: env.JWT_ISSUER,
    expiresIn: env.REFRESH_TOKEN_EXPIRY as unknown as number,
  };
  return jwt.sign(claims, env.REFRESH_TOKEN_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET, { issuer: env.JWT_ISSUER }) as JwtPayload;
  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
    role: decoded.role as AccessTokenClaims["role"],
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

