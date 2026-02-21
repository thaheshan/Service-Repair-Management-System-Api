import pinoHttp from "pino-http";
import { logger } from '@/config/logger.config';


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
    req(req) {
      return {
        method: req.method,
        url: req.url,
        body: req.body,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export default httpLoggerMiddleware;