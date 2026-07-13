import { z } from "zod";
import { env } from "../config/env";

export const ImportRequestSchema = z.object({
  filename: z.string().min(1).max(255).default("upload.csv"),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, "At least one row is required")
    .max(env.MAX_ROWS_PER_REQUEST, `Maximum ${env.MAX_ROWS_PER_REQUEST} rows per request`),
  batchSize: z
    .number()
    .int()
    .positive()
    .optional(),
});

export type ImportRequest = z.infer<typeof ImportRequestSchema>;
