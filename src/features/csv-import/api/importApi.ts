import axios, { AxiosError } from "axios";
import { API_BASE_URL, DEFAULT_BATCH_SIZE } from "../constants";
import type { ImportResponse } from "../types";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180_000,
  headers: { "Content-Type": "application/json" },
});

export interface ImportRequest {
  filename: string;
  rows: Record<string, string>[];
  batchSize?: number;
}

export async function importLeads(
  payload: ImportRequest,
  onProgress?: (event: {
    type: "progress";
    chunkNum: number;
    totalChunks: number;
    batchNum: number;
    totalBatches: number;
  }) => void,
): Promise<ImportResponse> {
  try {
    const url = `${API_BASE_URL}/api/import`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: payload.filename,
        rows: payload.rows,
        batchSize: payload.batchSize ?? DEFAULT_BATCH_SIZE,
      }),
    });

    if (!response.ok) {
      let rawMsg = "Unknown import error";
      try {
        const errJson = await response.json();
        rawMsg = errJson.error || errJson.message || rawMsg;
      } catch { }

      let friendlyMsg = "Something went wrong. Please try again later.";
      if (
        response.status === 429 ||
        rawMsg.toLowerCase().includes("quota") ||
        rawMsg.toLowerCase().includes("429")
      ) {
        friendlyMsg =
          "Gemini API quota has been reached. Please wait about one minute before retrying.";
      } else if (
        rawMsg.toLowerCase().includes("json") ||
        rawMsg.toLowerCase().includes("missing 'leads'")
      ) {
        friendlyMsg = "The AI returned an invalid response. Please retry the import.";
      }
      throw new Error(friendlyMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("ReadableStream not supported on this browser context.");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let finalResult: ImportResponse | null = null;
    let streamError: string | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("data: ")) {
          const str = trimmed.substring(6).trim();
          try {
            const parsed = JSON.parse(str);
            if (parsed.type === "progress") {
              onProgress?.(parsed);
            } else if (parsed.type === "complete") {
              finalResult = parsed.result;
            } else if (parsed.type === "error") {
              streamError = parsed.message;
            }
          } catch (e) {
            console.error("Failed to parse SSE line", e);
          }
        }
      }
    }

    if (streamError) {
      throw new Error(streamError);
    }

    if (!finalResult) {
      throw new Error("No completion payload received from import processor.");
    }

    return finalResult;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    let friendlyMsg = "Something went wrong. Please try again later.";

    if (
      msg.toLowerCase().includes("quota") ||
      msg.toLowerCase().includes("429")
    ) {
      friendlyMsg =
        "Gemini API quota has been reached. Please wait about one minute before retrying.";
    } else if (
      msg.toLowerCase().includes("json") ||
      msg.toLowerCase().includes("missing 'leads'")
    ) {
      friendlyMsg = "The AI returned an invalid response. Please retry the import.";
    } else if (msg.length > 5 && !msg.toLowerCase().includes("failed to fetch")) {
      friendlyMsg = msg;
    }

    throw new Error(friendlyMsg);
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const { status } = await client.get("/api/health");
    return status === 200;
  } catch {
    return false;
  }
}
