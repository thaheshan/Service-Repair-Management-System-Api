import { ApiError } from "@/utils/common.util";
import { NextFunction, Request, Response } from "express";
export const notFoundMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};