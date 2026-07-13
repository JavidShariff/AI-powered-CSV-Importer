import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const flat = err.flatten();
    logger.warn("Validation error", { path: req.path, issues: flat });
    res.status(400).json({
      error: "ValidationError",
      message: "Request payload is invalid",
      details: flat,
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
    return;
  }
  const message = err instanceof Error ? err.message : "Unknown server error";
  logger.error("Unhandled error", { path: req.path, error: message });
  res.status(500).json({ error: "InternalServerError", message });
}
