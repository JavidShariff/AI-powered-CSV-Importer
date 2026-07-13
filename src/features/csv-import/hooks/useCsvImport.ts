"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { parseCsvFile } from "../lib/csv";
import { importLeads } from "../api/importApi";
import { useImportStore } from "../store/importStore";
import { DEFAULT_BATCH_SIZE, MAX_FILE_SIZE_BYTES } from "../constants";

export function useCsvImport() {
  const { setParsed, setStage, setResult, setError, goTo, parsed } = useImportStore();
  const isSubmittingRef = useRef(false);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error("File too large", { description: `Max size is 20 MB — this file is ${(file.size / 1024 / 1024).toFixed(1)} MB` });
        return;
      }
      // Validate extension
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Invalid file type", { description: "Please upload a .csv file" });
        return;
      }

      try {
        setStage("parsing", { label: "Parsing CSV…", progress: 25 });
        const parsedCsv = await parseCsvFile(file);

        if (parsedCsv.rows.length === 0) {
          toast.error("Empty CSV", { description: "The file has no data rows. Check that the file has a header row followed by data." });
          setStage("idle");
          return;
        }

        setParsed(parsedCsv);
        setStage("preview", { label: "Preview ready", progress: 100 });
        // Advance to Preview step
        goTo(2);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to parse CSV";
        toast.error("Parse failed", { description: msg });
        setStage("error");
        setError(msg);
      }
    },
    [setParsed, setStage, goTo, setError],
  );

  const confirmImport = useCallback(
    async (batchSize = DEFAULT_BATCH_SIZE) => {
      if (!parsed) {
        toast.error("No file selected", { description: "Please upload a CSV file first." });
        return;
      }

      // Idempotency guard — prevent double-submission
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      const totalBatches = Math.max(1, Math.ceil(parsed.rows.length / batchSize));

      try {
        // Advance to processing step first
        goTo(4);
        setStage("preparing", { label: "Preparing AI extractor…", progress: 10 });

        await new Promise((r) => setTimeout(r, 400));
        setStage("processing", {
          label: `Processing ${totalBatches} batch${totalBatches > 1 ? "es" : ""} with Gemini…`,
          progress: 30,
        });

        let result;
        result = await importLeads(
          { filename: parsed.filename, rows: parsed.rows, batchSize },
          (prog) => {
            const chunkProgress = (prog.chunkNum - 1) / prog.totalChunks;
            const batchProgress = (prog.batchNum / prog.totalBatches) / prog.totalChunks;
            const pct = Math.min(85, Math.floor(30 + 55 * (chunkProgress + batchProgress)));

            useImportStore.setState({
              currentChunk: prog.chunkNum,
              totalChunks: prog.totalChunks,
              currentBatch: prog.batchNum,
              totalBatches: prog.totalBatches,
              progress: pct,
              progressLabel: `Processing chunk ${prog.chunkNum} of ${prog.totalChunks}... Batch ${prog.batchNum} of ${prog.totalBatches}...`,
            });
          }
        );

        setStage("finalizing", { label: "Finalizing & validating results…", progress: 95 });
        await new Promise((r) => setTimeout(r, 300));

        setResult(result);

        if (result.completed) {
          toast.success("Import complete!", {
            description: `${result.stats.importedCount.toLocaleString()} lead${result.stats.importedCount !== 1 ? "s" : ""} imported`,
          });
        } else if (result.stopReason === "quota") {
          toast.warning("Import partially completed", {
            description: `${result.stats.importedCount.toLocaleString()} leads saved. Gemini Free Tier quota reached — ${result.stats.remainingRows.toLocaleString()} rows remaining.`,
            duration: 8000,
          });
        } else {
          toast.warning("Import finished with warnings", {
            description: result.message,
            duration: 6000,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Import failed";
        setStage("error");
        setError(msg);
        toast.error("Import failed", { description: msg });
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [parsed, goTo, setStage, setResult, setError],
  );

  return { handleFile, confirmImport };
}
