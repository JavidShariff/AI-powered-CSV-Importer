import type { Request, Response } from "express";
import { env } from "../config/env";
import { PROMPT_METADATA } from "../prompts/extraction.prompt";

export function health(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    env: env.NODE_ENV,
    model: env.GEMINI_MODEL,
    prompt: PROMPT_METADATA,
  });
}
