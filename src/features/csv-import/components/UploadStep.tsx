"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { AlertCircle, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_MIME, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from "../constants";
import { formatBytes } from "../lib/csv";
import { useImportStore } from "../store/importStore";
import { useCsvImport } from "../hooks/useCsvImport";

export function UploadStep() {
  const parsed = useImportStore((s) => s.parsed);
  const setParsed = useImportStore((s) => s.setParsed);
  const stage = useImportStore((s) => s.stage);
  const error = useImportStore((s) => s.error);
  const { handleFile } = useCsvImport();
  const [rejectedMsg, setRejectedMsg] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      setRejectedMsg(null);
      if (rejections.length > 0) {
        const msg = rejections[0]?.errors?.[0]?.message ?? "File rejected";
        setRejectedMsg(msg);
        return;
      }
      const file = accepted[0];
      if (file) await handleFile(file);
    },
    [handleFile],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    accept: ACCEPTED_MIME,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop,
  });

  const isParsing = stage === "parsing";

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          !isDragActive && !isDragReject && "border-border bg-muted/30",
          isParsing && "pointer-events-none opacity-60",
        )}
        aria-label="CSV drop zone"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && open()}
      >
        <input {...getInputProps()} aria-label="CSV file input" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isDragActive ? "Drop the file to upload" : "Drag & drop your CSV here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            CSV only · Up to {MAX_FILE_SIZE_LABEL} · Any column layout supported
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={open}
          disabled={isParsing}
          aria-label="Browse files"
          className="mt-1"
        >
          {isParsing ? "Parsing…" : "Browse files"}
        </Button>
      </div>

      {/* Rejection / parse error message */}
      {(rejectedMsg || (stage === "error" && error)) && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{rejectedMsg ?? error}</span>
        </div>
      )}

      {/* Selected file card */}
      {parsed && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-col leading-tight">
              <span className="block truncate text-sm font-medium text-foreground" title={parsed.filename}>
                {parsed.filename}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(parsed.size)} · {parsed.rows.length} rows · {parsed.headers.length}{" "}
                columns
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 shrink-0"
            onClick={() => {
              setParsed(null);
              setRejectedMsg(null);
            }}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
