export type CrmStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE"
  | "";

export type DataSource =
  | "leads_on_demand"
  | "meridian_tower"
  | "eden_park"
  | "varah_swamy"
  | "sarjapur_plots"
  | "";

export interface CanonicalLead {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus;
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export interface SkippedRow {
  index: number;
  reason: string;
  original: Record<string, unknown>;
}

export type StopReason = "completed" | "quota" | "network" | "json";

export interface ImportResponse {
  success: true;
  completed: boolean;
  stopReason: StopReason;
  message: string;
  imported: CanonicalLead[];
  skipped: SkippedRow[];
  stats: {
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
  };
}

export interface ParsedCsv {
  filename: string;
  size: number;
  headers: string[];
  rows: Record<string, string>[];
}

export type ImportStage =
  | "idle"
  | "uploading"
  | "parsing"
  | "preview"
  | "confirming"
  | "preparing"
  | "processing"
  | "finalizing"
  | "completed"
  | "error";
