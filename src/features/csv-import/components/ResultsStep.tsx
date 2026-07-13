"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  BrainCircuit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "./DataTable";
import { useImportStore } from "../store/importStore";
import type { CanonicalLead, SkippedRow } from "../types";
import { downloadCsv, downloadJson } from "../lib/download";

function statusBadge(status: string) {
  if (!status) return <span className="text-muted-foreground/60">—</span>;
  const tone =
    status === "SALE_DONE"
      ? "bg-primary/10 text-primary"
      : status === "BAD_LEAD"
        ? "bg-destructive/10 text-destructive"
        : status === "DID_NOT_CONNECT"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
  );
}

export function ResultsStep() {
  const result = useImportStore((s) => s.result);
  const parsed = useImportStore((s) => s.parsed);

  const importedColumns = useMemo<ColumnDef<CanonicalLead>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        id: "phone",
        header: "Phone",
        accessorFn: (r) =>
          [r.country_code, r.mobile_without_country_code].filter(Boolean).join(" "),
      },
      { accessorKey: "company", header: "Company" },
      { accessorKey: "city", header: "City" },
      { accessorKey: "state", header: "State" },
      { accessorKey: "country", header: "Country" },
      {
        accessorKey: "crm_status",
        header: "Status",
        cell: ({ getValue }) => statusBadge(String(getValue() ?? "")),
      },
      { accessorKey: "data_source", header: "Source" },
      { accessorKey: "lead_owner", header: "Owner" },
    ],
    [],
  );

  const skippedColumns = useMemo<ColumnDef<SkippedRow>[]>(
    () => [
      { accessorKey: "index", header: "Row #" },
      { accessorKey: "reason", header: "Reason" },
      {
        id: "preview",
        header: "Original data",
        cell: ({ row }) => {
          const s = JSON.stringify(row.original.original);
          return (
            <span
              className="block max-w-[240px] truncate text-xs text-muted-foreground sm:max-w-[360px]"
              title={s}
            >
              {s}
            </span>
          );
        },
      },
    ],
    [],
  );

  if (!result) return null;

  const { stats, imported, skipped } = result;
  const base = parsed?.filename?.replace(/\.csv$/i, "") ?? "leads";

  const completionPct =
    stats.totalRows > 0
      ? Math.round((stats.processedRows / stats.totalRows) * 100)
      : 100;

  return (
    <div className="flex flex-col gap-5">
      {/* Status banner — contextual per stopReason */}
      <StatusBanner
        completed={result.completed}
        stopReason={result.stopReason}
        importedCount={stats.importedCount}
        remainingRows={stats.remainingRows}
        processingTimeMs={stats.processingTimeMs}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Rows" value={stats.totalRows.toLocaleString()} tone="muted" />
        <StatCard label="Processed" value={`${stats.processedRows.toLocaleString()} (${completionPct}%)`} tone="muted" />
        <StatCard label="Imported" value={stats.importedCount.toLocaleString()} tone="primary" />
        <StatCard label="Remaining" value={stats.remainingRows.toLocaleString()} tone={stats.remainingRows > 0 ? "warning" : "muted"} />
        <StatCard label="Skipped" value={(stats.skippedCount - stats.failedRows).toLocaleString()} tone="muted" />
        <StatCard label="Failed Rows" value={stats.failedRows.toLocaleString()} tone={stats.failedRows > 0 ? "warning" : "muted"} />
        <StatCard label="Failed Batches" value={stats.failedBatches} tone={stats.failedBatches > 0 ? "warning" : "muted"} />
        <StatCard label="Processing Time" value={`${(stats.processingTimeMs / 1000).toFixed(1)}s`} tone="muted" />
      </div>

      {/* Download buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCsv(imported, `${base}-imported.csv`)}
          aria-label="Download imported leads as CSV"
          disabled={imported.length === 0}
        >
          <FileSpreadsheet className="mr-1.5 h-4 w-4" />
          Download CSV {imported.length > 0 && `(${imported.length})`}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadJson(result, `${base}-import.json`)}
          aria-label="Download full import result as JSON"
        >
          <FileJson className="mr-1.5 h-4 w-4" />
          Download JSON
        </Button>
        <Badge variant="outline" className="ml-auto gap-1">
          <Download className="h-3 w-3" />
          {stats.batches} batch{stats.batches !== 1 && "es"} processed
        </Badge>
      </div>

      {/* Data tabs */}
      <Tabs defaultValue="imported">
        <TabsList>
          <TabsTrigger value="imported">
            Imported ({imported.length})
          </TabsTrigger>
          <TabsTrigger value="skipped">
            Skipped ({skipped.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="imported" className="mt-3">
          <DataTable
            columns={importedColumns}
            data={imported}
            emptyMessage="No leads were imported"
            maxHeight="280px"
          />
        </TabsContent>
        <TabsContent value="skipped" className="mt-3">
          <DataTable
            columns={skippedColumns}
            data={skipped}
            emptyMessage="Nothing was skipped 🎉"
            maxHeight="280px"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status banner component — driven by stopReason
// ---------------------------------------------------------------------------
function StatusBanner({
  completed,
  stopReason,
  importedCount,
  remainingRows,
  processingTimeMs,
}: {
  completed: boolean;
  stopReason: string;
  importedCount: number;
  remainingRows: number;
  processingTimeMs: number;
}) {
  if (completed) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">
            ✅ Import completed successfully
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {importedCount.toLocaleString()} lead{importedCount !== 1 ? "s" : ""} imported in{" "}
            {(processingTimeMs / 1000).toFixed(2)}s.
          </p>
        </div>
      </div>
    );
  }

  if (stopReason === "quota") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-300/40 bg-amber-50/60 px-4 py-4 dark:border-amber-700/40 dark:bg-amber-950/20">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="flex flex-col gap-1.5 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            🟡 Import partially completed
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-amber-800 dark:text-amber-300">
            <span className="text-muted-foreground">Imported:</span>
            <span className="font-medium">{importedCount.toLocaleString()} leads</span>
            <span className="text-muted-foreground">Remaining:</span>
            <span className="font-medium">{remainingRows.toLocaleString()} rows</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Reason:</strong> Gemini Free Tier daily quota has been reached.
          </p>
          <p className="text-xs text-muted-foreground">
            No data has been lost. You can download the processed results below and resume
            tomorrow, or upgrade to a paid Gemini API key to remove quota limitations.
          </p>
        </div>
      </div>
    );
  }

  if (stopReason === "json") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-300/30 bg-amber-50/40 px-4 py-3 dark:border-amber-700/30 dark:bg-amber-950/10">
        <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div>
          <p className="text-sm font-semibold">AI returned an invalid response</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Some batches could not be processed because the AI model returned malformed data.
            {importedCount > 0 && ` ${importedCount.toLocaleString()} leads were saved successfully.`}
          </p>
        </div>
      </div>
    );
  }

  if (stopReason === "network") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
        <div>
          <p className="text-sm font-semibold">Network error during import</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The connection to the AI service was interrupted.
            {importedCount > 0 && ` ${importedCount.toLocaleString()} leads were saved before the interruption.`}{" "}
            Please retry.
          </p>
        </div>
      </div>
    );
  }

  // Fallback for partial with unknown reason
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200/30 bg-amber-50/20 px-4 py-3">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
      <p className="text-sm font-medium">
        Import completed partially.{" "}
        <strong>{importedCount.toLocaleString()} leads</strong> imported.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "primary" | "warning" | "muted";
}) {
  const tint =
    tone === "primary"
      ? "text-primary"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";
  return (
    <Card className="p-3 shadow-none sm:p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold sm:text-2xl ${tint}`}>{value}</p>
    </Card>
  );
}
