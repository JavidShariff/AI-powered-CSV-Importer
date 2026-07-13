export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_FILE_SIZE_LABEL = "20 MB";
export const ACCEPTED_MIME = {
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".csv"],
  "text/plain": [".csv"],
};
export const DEFAULT_BATCH_SIZE = 5;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

