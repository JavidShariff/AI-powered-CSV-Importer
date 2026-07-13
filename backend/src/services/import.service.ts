/**
 * Production-ready Gemini import service.
 * – Adaptive chunk sizes based on total row count
 * – Per-chunk adaptive batch sizes
 * – Prompt-size guard (max 25 000 chars)
 * – Dedicated quota detection via quotaDetect.ts
 * – Daily quota → stop immediately, return partial
 * – Minute quota → respect RetryInfo, retry once, continue
 * – Persistent JSON error → mark batch failed, continue
 * – SSE progress callbacks for the frontend
 */
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { chunk } from "../utils/chunk";
import { sleep } from "../utils/retry";
import { getGeminiService } from "./gemini.service";
import { buildExtractionPrompt } from "../prompts/extraction.prompt";
import { detectQuotaType, isQuotaExceeded, parseRetryDelayMs } from "../utils/quotaDetect";
import type {
  BatchResult,
  CanonicalLead,
  ImportResponse,
  SkippedRow,
  StopReason,
} from "../types";

const MAX_PROMPT_CHARS = 25_000;

export interface ProgressEvent {
  type: "progress";
  chunkNum: number;
  totalChunks: number;
  batchNum: number;
  totalBatches: number;
  processedRows: number;
  totalRows: number;
  elapsedMs: number;
}

interface ImportOptions {
  filename: string;
  rows: Record<string, unknown>[];
  batchSize?: number;
  onProgress?: (prog: ProgressEvent) => void;
}

// ---------------------------------------------------------------------------
// Batch execution
// ---------------------------------------------------------------------------

async function executeBatch(
  batch: Record<string, unknown>[],
  offset: number,
): Promise<{ result: BatchResult; attempts: number }> {
  const gemini = getGeminiService();

  // Try once, then retry once more for JSON errors only
  let jsonAttempts = 0;

  const run = async () => {
    try {
      return await gemini.extractLeads(batch);
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      // JSON-specific single retry (not for quota errors)
      if (!isQuotaExceeded(err) && (msg.includes("json") || msg.includes("parse") || msg.includes("leads")) && jsonAttempts < 1) {
        jsonAttempts++;
        logger.warn("JSON parse error — retrying batch once");
        return await gemini.extractLeads(batch);
      }
      throw err;
    }
  };

  const raw = await run();
  const imported: CanonicalLead[] = [];
  const skipped: SkippedRow[] = [];

  raw.leads.forEach((lead, i) => {
    const original = batch[i] ?? {};
    if (!lead || (!lead.email && !lead.mobile_without_country_code)) {
      skipped.push({
        index: offset + i,
        reason: lead ? "Neither email nor phone after normalization" : "AI returned null for this row",
        original: original as Record<string, unknown>,
      });
    } else {
      imported.push(lead);
    }
  });

  return { result: { imported, skipped, attempts: jsonAttempts + 1 }, attempts: jsonAttempts + 1 };
}

// ---------------------------------------------------------------------------
// Batch list builder with prompt-size guard
// ---------------------------------------------------------------------------

function buildBatches(
  rows: Record<string, unknown>[],
  batchSize: number,
): Record<string, unknown>[][] {
  const batches: Record<string, unknown>[][] = [];
  let i = 0;
  while (i < rows.length) {
    let end = Math.min(i + batchSize, rows.length);
    let candidate = rows.slice(i, end);
    // Shrink until prompt is within safety limit
    while (candidate.length > 1 && buildExtractionPrompt(candidate).length > MAX_PROMPT_CHARS) {
      candidate = candidate.slice(0, candidate.length - 1);
    }
    batches.push(candidate);
    i += candidate.length;
  }
  return batches;
}

// ---------------------------------------------------------------------------
// Run import
// ---------------------------------------------------------------------------

export async function runImport(opts: ImportOptions): Promise<ImportResponse> {
  const started = Date.now();
  const totalRows = opts.rows.length;

  // Adaptive chunk sizes
  let chunkSize: number;
  if (totalRows <= 100) chunkSize = 50;
  else if (totalRows <= 1000) chunkSize = 100;
  else chunkSize = 250;

  const chunks = chunk(opts.rows, chunkSize);
  const totalChunks = chunks.length;

  logger.info(`Import started | rows=${totalRows} chunks=${totalChunks} chunkSize=${chunkSize} file=${opts.filename}`);

  const allImported: CanonicalLead[] = [];
  const allSkipped: SkippedRow[] = [];

  let processedRows = 0;
  let failedRows = 0;
  let failedBatches = 0;
  let retriesPerformed = 0;
  let completedChunks = 0;

  let stopReason: StopReason = "completed";
  let processingStopped = false;
  let totalBatchesProcessed = 0;

  outer: for (let c = 0; c < chunks.length; c++) {
    const chunkRows = chunks[c]!;

    // Adaptive batch size per chunk
    const chunkLen = chunkRows.length;
    let adaptiveBatch = chunkLen <= 25 ? 5 : chunkLen <= 100 ? 8 : 10;
    let batchSize = Math.min(
      Math.max(1, opts.batchSize ?? adaptiveBatch),
      env.MAX_BATCH_SIZE,
    );

    const batches = buildBatches(chunkRows, batchSize);
    const totalBatchesInChunk = batches.length;

    logger.info(`Chunk ${c + 1}/${totalChunks} | rows=${chunkRows.length} batches=${totalBatchesInChunk}`);

    let chunkOffset = processedRows;

    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b]!;

      opts.onProgress?.({
        type: "progress",
        chunkNum: c + 1,
        totalChunks,
        batchNum: b + 1,
        totalBatches: totalBatchesInChunk,
        processedRows,
        totalRows,
        elapsedMs: Date.now() - started,
      });

      logger.info(`Batch ${b + 1}/${totalBatchesInChunk} | size=${batch.length}`);

      let batchSucceeded = false;
      let minuteRetried = false;

      try {
        const { result, attempts } = await executeBatch(batch, chunkOffset);
        retriesPerformed += attempts - 1;
        allImported.push(...result.imported);
        allSkipped.push(...result.skipped);
        processedRows += batch.length;
        chunkOffset += batch.length;
        totalBatchesProcessed++;
        batchSucceeded = true;
        logger.info(`${result.imported.length} rows imported`);
      } catch (err) {
        const quotaType = detectQuotaType(err);

        if (quotaType === "daily") {
          // Stop immediately — daily quota cannot be recovered by waiting
          logger.warn("Daily quota reached — stopping import, returning partial result");
          stopReason = "quota";
          processingStopped = true;
          break outer;
        }

        if (quotaType === "minute" && !minuteRetried) {
          // Respect RetryInfo delay, then retry once
          minuteRetried = true;
          const retryMs = parseRetryDelayMs(err);
          const waitMs = retryMs > 0 ? retryMs + Math.floor(Math.random() * 500) : env.RETRY_BASE_MS;
          logger.warn(`Minute quota reached — waiting ${Math.round(waitMs / 1000)}s before retry`);
          retriesPerformed++;
          await sleep(waitMs);

          try {
            const { result, attempts } = await executeBatch(batch, chunkOffset);
            retriesPerformed += attempts - 1;
            allImported.push(...result.imported);
            allSkipped.push(...result.skipped);
            processedRows += batch.length;
            chunkOffset += batch.length;
            totalBatchesProcessed++;
            batchSucceeded = true;
            logger.info(`${result.imported.length} rows imported (after minute-quota retry)`);
          } catch (retryErr) {
            // If the retry also hit daily quota, stop
            if (detectQuotaType(retryErr) === "daily") {
              logger.warn("Daily quota reached on retry — stopping");
              stopReason = "quota";
              processingStopped = true;
              break outer;
            }
            // Otherwise fall through to batch-failure handling below
            const msg = retryErr instanceof Error ? retryErr.message : String(retryErr);
            const isJson = !isQuotaExceeded(retryErr) && (msg.toLowerCase().includes("json") || msg.toLowerCase().includes("parse"));
            stopReason = isJson ? "json" : isQuotaExceeded(retryErr) ? "quota" : "network";
          }
        }

        if (!batchSucceeded) {
          failedBatches++;
          failedRows += batch.length;
          totalBatchesProcessed++;
          const msg = err instanceof Error ? err.message : String(err);
          const isJson = !isQuotaExceeded(err) && (msg.toLowerCase().includes("json") || msg.toLowerCase().includes("parse"));
          const reason = isJson
            ? "AI returned invalid JSON for this batch"
            : isQuotaExceeded(err)
              ? "Quota limit reached"
              : "Processing error";

          batch.forEach((row, j) => {
            allSkipped.push({
              index: chunkOffset + j,
              reason,
              original: row as Record<string, unknown>,
            });
          });
          logger.warn(`Batch ${b + 1}/${totalBatchesInChunk} failed: ${reason}`);
          chunkOffset += batch.length;
        }
      }
    }

    if (processingStopped) break;
    completedChunks++;
  }

  const processingTimeMs = Date.now() - started;
  const remainingRows = totalRows - processedRows;
  const importedCount = allImported.length;
  const skippedCount = allSkipped.length;
  const successRate = processedRows === 0 ? 0 : importedCount / processedRows;

  const completed = !processingStopped;
  if (completed) stopReason = "completed";

  const message = buildUserMessage(stopReason, importedCount, remainingRows);

  logger.info(`Import finished | processed=${processedRows}/${totalRows} imported=${importedCount} stopReason=${stopReason} ms=${processingTimeMs}`);

  return {
    success: true,
    completed,
    stopReason,
    message,
    imported: allImported,
    skipped: allSkipped,
    stats: {
      totalRows,
      processedRows,
      remainingRows,
      importedCount,
      skippedCount,
      failedRows,
      batches: totalBatchesProcessed,
      failedBatches,
      retriesPerformed,
      successRate,
      processingTimeMs,
      batchSizeUsed: opts.batchSize ?? (totalRows <= 25 ? 5 : totalRows <= 100 ? 8 : 10),
      completedChunks,
      remainingChunks: totalChunks - completedChunks,
    },
  };
}

function buildUserMessage(stopReason: StopReason, importedCount: number, remainingRows: number): string {
  switch (stopReason) {
    case "completed":
      return `All rows processed successfully. ${importedCount} lead${importedCount !== 1 ? "s" : ""} imported.`;
    case "quota":
      return `Processing stopped because the Gemini Free Tier daily quota was reached. ${importedCount} lead${importedCount !== 1 ? "s" : ""} were imported. ${remainingRows} row${remainingRows !== 1 ? "s" : ""} remain. You can resume tomorrow or upgrade to a paid Gemini API key.`;
    case "json":
      return `Some batches returned invalid AI responses and were skipped. ${importedCount} lead${importedCount !== 1 ? "s" : ""} were imported successfully.`;
    case "network":
      return `A network error interrupted the import. ${importedCount} lead${importedCount !== 1 ? "s" : ""} were saved before the interruption. Please retry.`;
    default:
      return `Import finished. ${importedCount} lead${importedCount !== 1 ? "s" : ""} imported.`;
  }
}
