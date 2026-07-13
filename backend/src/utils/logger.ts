/* eslint-disable no-console */
type Level = "debug" | "info" | "warn" | "error";

function fmt(level: Level, msg: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase()} ${msg}`;
  if (!meta || Object.keys(meta).length === 0) return base;
  return `${base} ${JSON.stringify(meta)}`;
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    process.env.NODE_ENV !== "production" && console.log(fmt("debug", msg, meta)),
  info: (msg: string, meta?: Record<string, unknown>) => console.log(fmt("info", msg, meta)),
  warn: (msg: string, meta?: Record<string, unknown>) => console.warn(fmt("warn", msg, meta)),
  error: (msg: string, meta?: Record<string, unknown>) => console.error(fmt("error", msg, meta)),
};
