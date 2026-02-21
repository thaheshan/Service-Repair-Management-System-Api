import { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = (req.body as Record<string, unknown>)?.email ?? "unknown";
    const ip = ipKeyGenerator(req.ip!);
    return `${ip}-${email}`;
  },
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});