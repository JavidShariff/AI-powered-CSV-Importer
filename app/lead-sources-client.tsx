"use client";

import { Sparkles, Upload, Database, Shield, Zap } from "lucide-react";
import { AppShell } from "@/components/crm/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImportModal } from "@/features/csv-import/components/ImportModal";
import { useImportStore } from "@/features/csv-import/store/importStore";

const FEATURES = [
    {
        icon: Sparkles,
        title: "Semantic column mapping",
        body: "Gemini reads unfamiliar column names — 'cell', 'contact', 'customer phone' — and maps them to the canonical schema.",
    },
    {
        icon: Zap,
        title: "Batched, resilient processing",
        body: "Rows are split into configurable batches with exponential-backoff retries on transient failures.",
    },
    {
        icon: Shield,
        title: "Zero hallucinations",
        body: "The prompt forbids inventing data. Unknown fields stay blank. Only whitelisted status & source values are emitted.",
    },
];

const SOURCES = [
    "Facebook Leads",
    "Google Ads",
    "Real Estate CRMs",
    "Sales Reports",
    "Marketing exports",
    "Manual spreadsheets",
];

export function LeadSourcesPageClient() {
    const openModal = useImportStore((s) => s.openModal);

    return (
        <AppShell>
            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                Lead Sources
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                                Import leads from anywhere
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                Upload any CRM CSV — Facebook, Google Ads, real estate exports, or a
                                one-off spreadsheet. Our AI-powered importer understands columns
                                semantically and normalizes everything into a single canonical schema.
                            </p>
                        </div>
                        <Button size="lg" onClick={openModal} className="shrink-0">
                            <Upload className="mr-2 h-4 w-4" />
                            Import Leads
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {FEATURES.map((f) => (
                            <Card key={f.title} className="p-5 shadow-none">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <f.icon className="h-4 w-4" />
                                </div>
                                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                            </Card>
                        ))}
                    </div>

                    <Card className="p-6 shadow-none">
                        <div className="flex flex-wrap items-start gap-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                <Database className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold">
                                    Compatible with any CRM export
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Column order, extra columns, missing columns, unknown formats — all
                                    handled by the AI extraction pipeline.
                                </p>
                                <ul className="mt-4 flex flex-wrap gap-2">
                                    {SOURCES.map((s) => (
                                        <li
                                            key={s}
                                            className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
                                        >
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button variant="outline" onClick={openModal}>
                                Start import
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6 shadow-none">
                        <h3 className="text-sm font-semibold">Recent imports</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            History is disabled in this demo — the application is intentionally
                            stateless. Once integrated with your database, completed imports appear
                            here.
                        </p>
                        <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                            No imports yet — click &quot;Import Leads&quot; to get started
                        </div>
                    </Card>
                </div>
            </div>

            <ImportModal />
        </AppShell>
    );
}
