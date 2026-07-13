"use client";

import { Clock, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useImportStore } from "../store/importStore";

const STAGE_STEPS: { key: string; label: string }[] = [
  { key: "preparing", label: "Preparing AI extractor" },
  { key: "processing", label: "Processing batches with Gemini" },
  { key: "finalizing", label: "Finalizing & validating results" },
  { key: "completed", label: "Completed" },
];

function formatMs(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

export function ProcessingStep() {
  const { stage, progress, progressLabel, error } = useImportStore();
  const { currentChunk, totalChunks, currentBatch, totalBatches } = useImportStore();

  const currentIdx = STAGE_STEPS.findIndex((s) => s.key === stage);

  // Derive a live detail line when we have chunk/batch info
  const hasLiveProgress = stage === "processing" && totalChunks > 0;

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Status icon + label */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {stage === "error" ? (
            <AlertCircle className="h-6 w-6 text-destructive" aria-label="Error" />
          ) : stage === "completed" ? (
            <CheckCircle2 className="h-6 w-6 text-primary" aria-label="Completed" />
          ) : (
            <div className="relative h-6 w-6">
              <Sparkles className="h-6 w-6 text-primary" aria-hidden />
              <Loader2
                className="absolute inset-0 h-6 w-6 animate-spin text-primary/40"
                aria-label="Processing"
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">
            {stage === "error" ? "Import failed" : progressLabel || "Working…"}
          </p>
          {stage === "error" ? (
            <p className="text-xs text-muted-foreground">
              {error ?? "An unexpected error occurred. Please try again."}
            </p>
          ) : hasLiveProgress ? (
            <p className="text-xs text-muted-foreground">
              Processing chunk <strong>{currentChunk}</strong> of <strong>{totalChunks}</strong>
              {totalBatches > 0 && (
                <> &mdash; Batch <strong>{currentBatch}</strong> of <strong>{totalBatches}</strong></>
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Gemini AI is normalizing your CSV into the canonical lead schema.
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2" aria-label={`Import progress: ${progress}%`} />

      {/* Stage checklist */}
      <ol className="space-y-2 text-sm" aria-label="Processing stages">
        {STAGE_STEPS.map((step, idx) => {
          const done = stage === "completed" || (currentIdx > idx && idx !== -1);
          const active = stage === step.key;
          return (
            <li key={step.key} className="flex items-center gap-2 text-muted-foreground">
              <span
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${done ? "bg-primary" : active ? "animate-pulse bg-primary/70" : "bg-border"
                  }`}
                aria-hidden
              />
              <span className={active ? "font-medium text-foreground" : ""}>{step.label}</span>
              {done && <span className="ml-auto text-xs text-primary">✓</span>}
            </li>
          );
        })}
      </ol>

      {/* Free tier notice */}
      {stage === "processing" && (
        <div className="flex items-center gap-2 rounded-md border border-blue-200/30 bg-blue-50/10 px-3 py-2 text-xs text-blue-600 dark:text-blue-400">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>
            Processing with Gemini Free Tier — large datasets are split into adaptive chunks to
            respect API rate limits.
          </span>
        </div>
      )}
    </div>
  );
}
