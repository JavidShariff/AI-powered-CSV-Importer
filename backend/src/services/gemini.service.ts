import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { extractJson, JsonParseError } from "../utils/jsonExtract";
import { buildExtractionPrompt } from "../prompts/extraction.prompt";
import { CanonicalLeadSchema, type CanonicalLead } from "../types";

export interface GeminiExtractionResult {
  /** One entry per input row; null means "skip this row". */
  leads: (CanonicalLead | null)[];
}

class GeminiService {
  private readonly client: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor() {
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = this.client.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: {
        temperature: 0,
        topP: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });
  }

  async extractLeads(rows: Record<string, unknown>[]): Promise<GeminiExtractionResult> {
    if (rows.length === 0) return { leads: [] };

    const prompt = buildExtractionPrompt(rows);
    const started = Date.now();
    const response = await this.model.generateContent(prompt);
    const text = response.response.text();
    logger.debug("Gemini responded", {
      ms: Date.now() - started,
      inputRows: rows.length,
      bytes: text.length,
    });

    const parsed = extractJson<{ leads: unknown }>(text);
    if (!parsed || !Array.isArray(parsed.leads)) {
      throw new JsonParseError("AI response missing 'leads' array", text);
    }

    const arr = (parsed as { leads: unknown[] }).leads;
    if (arr.length !== rows.length) {
      logger.warn("AI returned wrong array length", {
        expected: rows.length,
        got: arr.length,
      });
    }

    const leads: (CanonicalLead | null)[] = arr.map((item, i) => {
      if (item === null || item === undefined) return null;
      const result = CanonicalLeadSchema.safeParse(item);
      if (!result.success) {
        logger.warn("Invalid lead in AI response", {
          rowIndex: i,
          issues: result.error.flatten().fieldErrors,
        });
        return null;
      }
      return result.data;
    });

    // Pad or trim to exactly rows.length so the caller can pair rows by index.
    while (leads.length < rows.length) leads.push(null);
    if (leads.length > rows.length) leads.length = rows.length;

    return { leads };
  }
}

let instance: GeminiService | null = null;
export function getGeminiService(): GeminiService {
  if (!instance) instance = new GeminiService();
  return instance;
}
