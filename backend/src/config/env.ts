import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  CORS_ORIGIN: z.string().default("*"),
  DEFAULT_BATCH_SIZE: z.coerce.number().int().positive().default(10),
  MAX_BATCH_SIZE: z.coerce.number().int().positive().default(50),
  MAX_ROWS_PER_REQUEST: z.coerce.number().int().positive().default(50_000),
  MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  RETRY_BASE_MS: z.coerce.number().int().positive().default(5000),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Print a friendly error and bail — fail fast on misconfiguration.
    // eslint-disable-next-line no-console
    console.error("❌ Invalid environment configuration:");
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

export const corsOrigins: string[] | "*" =
  env.CORS_ORIGIN.trim() === "*"
    ? "*"
    : env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
