import { z } from "zod";
import { ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCE } from "../constants/schema";

export const CanonicalLeadSchema = z.object({
  created_at: z.string().default(""),
  name: z.string().default(""),
  email: z.string().default(""),
  country_code: z.string().default(""),
  mobile_without_country_code: z.string().default(""),
  company: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  country: z.string().default(""),
  lead_owner: z.string().default(""),
  crm_status: z
    .string()
    .default("")
    .transform((v) =>
      ALLOWED_CRM_STATUS.includes(v as (typeof ALLOWED_CRM_STATUS)[number])
        ? (v as (typeof ALLOWED_CRM_STATUS)[number])
        : "",
    ),
  crm_note: z.string().default(""),
  data_source: z
    .string()
    .default("")
    .transform((v) =>
      ALLOWED_DATA_SOURCE.includes(v as (typeof ALLOWED_DATA_SOURCE)[number])
        ? (v as (typeof ALLOWED_DATA_SOURCE)[number])
        : "",
    ),
  possession_time: z.string().default(""),
  description: z.string().default(""),
});
export type CanonicalLead = z.infer<typeof CanonicalLeadSchema>;

export interface SkippedRow {
  index: number;
  reason: string;
  original: Record<string, unknown>;
}

export interface BatchResult {
  imported: CanonicalLead[];
  skipped: SkippedRow[];
  attempts: number;
}

/**
 * Reason the import stopped:
 *  "completed" – all rows processed
 *  "quota"     – Gemini daily quota exhausted
 *  "network"   – unrecoverable network / service error
 *  "json"      – persistent AI JSON parse failure
 */
export type StopReason = "completed" | "quota" | "network" | "json";

export interface ImportStats {
  totalRows: number;
  processedRows: number;
  remainingRows: number;
  importedCount: number;
  skippedCount: number;
  failedRows: number;
  batches: number;
  failedBatches: number;
  retriesPerformed: number;
  successRate: number;
  processingTimeMs: number;
  batchSizeUsed: number;
  completedChunks: number;
  remainingChunks: number;
}

export interface ImportResponse {
  success: true;
  completed: boolean;
  stopReason: StopReason;
  message: string;
  imported: CanonicalLead[];
  skipped: SkippedRow[];
  stats: ImportStats;
}
