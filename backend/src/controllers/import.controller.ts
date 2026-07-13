import type { NextFunction, Request, Response } from "express";
import Papa from "papaparse";
import { ImportRequestSchema } from "../validators/import.validator";
import { runImport } from "../services/import.service";
import { HttpError } from "../middleware/errorHandler";

export async function importJson(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = ImportRequestSchema.parse(req.body);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const result = await runImport({
      filename: payload.filename,
      rows: payload.rows as Record<string, unknown>[],
      batchSize: payload.batchSize,
      onProgress: (prog) => {
        res.write(`data: ${JSON.stringify(prog)}\n\n`);
        (res as any).flush?.();
      },
    });

    res.write(`data: ${JSON.stringify({ type: "complete", result })}\n\n`);
    res.end();
  } catch (err) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : String(err) })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}

export async function importFile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) throw new HttpError(400, "No CSV file uploaded (field name: 'file')");
    const text = req.file.buffer.toString("utf-8");
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    });
    if (parsed.errors && parsed.errors.length > 0) {
      const critical = parsed.errors.find((e) => e.type !== "FieldMismatch");
      if (critical) throw new HttpError(400, `CSV parse error: ${critical.message}`);
    }
    const rows = parsed.data.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== ""),
    );
    const batchSize = req.body?.batchSize
      ? Number.parseInt(String(req.body.batchSize), 10)
      : undefined;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const result = await runImport({
      filename: req.file.originalname,
      rows,
      batchSize: Number.isFinite(batchSize) ? batchSize : undefined,
      onProgress: (prog) => {
        res.write(`data: ${JSON.stringify(prog)}\n\n`);
        (res as any).flush?.();
      },
    });

    res.write(`data: ${JSON.stringify({ type: "complete", result })}\n\n`);
    res.end();
  } catch (err) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : String(err) })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}
