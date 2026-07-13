"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useImportStore } from "../store/importStore";
import { DataTable } from "./DataTable";
import { Badge } from "@/components/ui/badge";

export function PreviewStep() {
  const parsed = useImportStore((s) => s.parsed);

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    if (!parsed) return [];
    return parsed.headers.map((h) => ({
      accessorKey: h,
      header: h || "(unnamed)",
      cell: ({ getValue }) => {
        const v = getValue();
        const s = v == null ? "" : String(v);
        return (
          <span className="block max-w-[180px] truncate sm:max-w-[240px]" title={s}>
            {s || <span className="text-muted-foreground/50">—</span>}
          </span>
        );
      },
    }));
  }, [parsed]);

  if (!parsed) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary" className="max-w-[180px] truncate" title={parsed.filename}>
          {parsed.filename}
        </Badge>
        <Badge variant="outline">{parsed.rows.length} rows</Badge>
        <Badge variant="outline">{parsed.headers.length} columns</Badge>
        <span className="text-muted-foreground hidden sm:inline">
          Parsed locally — no data has left your browser yet.
        </span>
      </div>
      <span className="text-xs text-muted-foreground sm:hidden">
        Parsed locally — no data has left your browser yet.
      </span>
      <DataTable
        columns={columns}
        data={parsed.rows}
        pageSize={10}
        maxHeight="380px"
        emptyMessage="No rows in CSV"
      />
    </div>
  );
}
