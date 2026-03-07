import pinoHttp from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";
import { logger } from "@/config/logger.config";

const httpLoggerMiddleware = pinoHttp({
  logger,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.confirmPassword",
      "req.body.token",
      "req.body.accessToken",
      "req.body.refreshToken",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    req(req: IncomingMessage & { body?: unknown }) {
      return {
        method: req.method,
        url: req.url,
        body: (req as any).body,
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export default httpLoggerMiddleware;