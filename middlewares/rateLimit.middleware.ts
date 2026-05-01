import { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10000, // Effectively disabled
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10000, // Effectively disabled
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