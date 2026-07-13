"use client";

import { create } from "zustand";
import type { ImportResponse, ImportStage, ParsedCsv } from "../types";

interface ImportState {
  open: boolean;
  step: 1 | 2 | 3 | 4;
  stage: ImportStage;
  progress: number;
  progressLabel: string;
  parsed: ParsedCsv | null;
  result: ImportResponse | null;
  error: string | null;
  currentChunk: number;
  totalChunks: number;
  currentBatch: number;
  totalBatches: number;

  openModal: () => void;
  closeModal: () => void;
  reset: () => void;
  setParsed: (parsed: ParsedCsv | null) => void;
  goTo: (step: 1 | 2 | 3 | 4) => void;
  setStage: (stage: ImportStage, opts?: { progress?: number; label?: string }) => void;
  setResult: (result: ImportResponse) => void;
  setError: (error: string | null) => void;
}

const INITIAL_STATE = {
  open: false,
  step: 1 as const,
  stage: "idle" as ImportStage,
  progress: 0,
  progressLabel: "",
  parsed: null,
  result: null,
  error: null,
  currentChunk: 0,
  totalChunks: 0,
  currentBatch: 0,
  totalBatches: 0,
};

export const useImportStore = create<ImportState>((set) => ({
  ...INITIAL_STATE,

  openModal: () => set({ open: true }),
  closeModal: () => set({ ...INITIAL_STATE, open: false }),
  reset: () => set({ ...INITIAL_STATE, open: true }),
  setParsed: (parsed) => set({ parsed }),
  goTo: (step) => set({ step }),
  setStage: (stage, opts) =>
    set({
      stage,
      progress: opts?.progress ?? 0,
      progressLabel: opts?.label ?? "",
    }),
  setResult: (result) => set({ result, stage: "completed", progress: 100 }),
  setError: (error) => set({ error, stage: error ? "error" : "idle" }),
}));
