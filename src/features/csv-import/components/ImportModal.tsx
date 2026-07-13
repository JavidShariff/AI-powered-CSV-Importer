"use client";

import { useCallback } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImportStore } from "../store/importStore";
import { UploadStep } from "./UploadStep";
import { PreviewStep } from "./PreviewStep";
import { ProcessingStep } from "./ProcessingStep";
import { ResultsStep } from "./ResultsStep";
import { useCsvImport } from "../hooks/useCsvImport";

const STEPS = [
  { n: 1, label: "Upload" },
  { n: 2, label: "Preview" },
  { n: 3, label: "Confirm" },
  { n: 4, label: "Results" },
] as const;

export function ImportModal() {
  const {
    open,
    closeModal,
    step,
    goTo,
    parsed,
    stage,
    reset,
  } = useImportStore();
  const { confirmImport } = useCsvImport();

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) closeModal();
    },
    [closeModal],
  );

  const isProcessing = step === 4 && stage !== "completed" && stage !== "error";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0"
        // Prevent closing while actively processing
        onInteractOutside={isProcessing ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isProcessing ? (e) => e.preventDefault() : undefined}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            Import Leads
          </DialogTitle>
          <DialogDescription className="text-sm">
            AI-powered semantic mapping — upload any CRM CSV and we normalize it for you.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="shrink-0 border-b border-border px-6 py-3">
          <Stepper current={step} />
        </div>

        {/* Step content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && <UploadStep />}
          {step === 2 && <PreviewStep />}
          {step === 3 && <ConfirmView />}
          {step === 4 && (stage === "completed" ? <ResultsStep /> : <ProcessingStep />)}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 border-t border-border px-6 py-3 sm:justify-between">
          {/* Back */}
          <div>
            {step > 1 && step < 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goTo((step - 1) as 1 | 2 | 3)}
                aria-label="Go to previous step"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          {/* Primary actions */}
          <div className="flex gap-2">
            {/* Results: Import another or Done */}
            {step === 4 && stage === "completed" && (
              <>
                <Button variant="outline" onClick={reset} aria-label="Import another file">
                  Import another
                </Button>
                <Button onClick={closeModal} aria-label="Close modal">
                  Done
                </Button>
              </>
            )}

            {/* Error state: retry */}
            {step === 4 && stage === "error" && (
              <>
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={() => goTo(3)}>
                  Try again
                </Button>
              </>
            )}

            {/* Preview: continue */}
            {step === 2 && (
              <Button
                onClick={() => goTo(3)}
                disabled={!parsed}
                aria-label="Continue to confirm step"
              >
                Continue
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}

            {/* Confirm: cancel or import */}
            {step === 3 && (
              <>
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void confirmImport()}
                  disabled={!parsed}
                  aria-label="Start AI import"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Import with AI
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
      aria-label="Import progress"
    >
      {STEPS.map((s, i) => {
        const active = s.n === current;
        const done = s.n < current;
        return (
          <li key={s.n} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${done
                ? "bg-primary/20 text-primary"
                : active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
                }`}
              aria-current={active ? "step" : undefined}
            >
              {s.n}
            </span>
            <span className={active ? "font-medium text-foreground" : ""}>{s.label}</span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 shrink-0 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ConfirmView() {
  const parsed = useImportStore((s) => s.parsed);
  if (!parsed) return null;

  const warningRows = parsed.rows.filter((r) => {
    const vals = Object.values(r).map((v) => String(v ?? "").trim());
    const hasEmail = vals.some((v) => v.includes("@"));
    const hasPhone = vals.some((v) => /\d{7,}/.test(v));
    return !hasEmail && !hasPhone;
  });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-5">
      <div>
        <h3 className="text-base font-semibold">Ready to import</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll send <strong>{parsed.rows.length}</strong> rows from{" "}
          <strong>{parsed.filename}</strong> to the Gemini AI extractor. Rows are processed in
          optimized, adaptive batches with automatic retries and rate limit backoff. Rows without a valid email or phone are skipped.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <li className="rounded-md bg-card p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Filename</p>
          <p className="mt-0.5 truncate font-medium" title={parsed.filename}>
            {parsed.filename}
          </p>
        </li>
        <li className="rounded-md bg-card p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Rows</p>
          <p className="mt-0.5 font-medium">{parsed.rows.length}</p>
        </li>
        <li className="rounded-md bg-card p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Columns detected</p>
          <p className="mt-0.5 font-medium">{parsed.headers.length}</p>
        </li>
        <li className="rounded-md bg-card p-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Batch size</p>
          <p className="mt-0.5 font-medium">Dynamic / Adaptive</p>
        </li>
      </ul>

      {parsed.rows.length > 25 && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
          ℹ️ Large datasets are automatically processed in smaller batches to stay within Gemini API limits.
        </div>
      )}

      {warningRows.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          ⚠️ <strong>{warningRows.length}</strong> row{warningRows.length !== 1 ? "s" : ""} have no
          detectable email or phone and will be skipped.
        </div>
      )}
    </div>
  );
}
