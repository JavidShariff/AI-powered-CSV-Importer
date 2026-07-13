import Papa from "papaparse";
import type { ParsedCsv } from "../types";

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          const critical = results.errors.filter((e) => e.type !== "FieldMismatch");
          if (critical.length > 0) {
            reject(new Error(`CSV parse error: ${critical[0].message}`));
            return;
          }
        }
        const rows = (results.data || []).filter((r) =>
          Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== ""),
        );
        const headers = results.meta.fields ?? (rows[0] ? Object.keys(rows[0]) : []);
        resolve({
          filename: file.name,
          size: file.size,
          headers,
          rows,
        });
      },
      error: (err) => reject(err),
    });
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
