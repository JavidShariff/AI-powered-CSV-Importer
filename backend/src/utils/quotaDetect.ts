/**
 * quotaDetect.ts
 * Centralized Gemini Free Tier quota detection and retry-delay parsing.
 * Never use ad-hoc string matching elsewhere — import from here.
 */

const DAILY_QUOTA_SIGNALS = [
    "generaterequestsperday",
    "generate_content_free_tier_requests",
    "requests per day",
    "daily",
    "quotavalue",
] as const;

const MINUTE_QUOTA_SIGNALS = [
    "generaterequestsperminute",
    "generate_content_free_tier_input_token_count",
    "requests per minute",
    "per minute",
    "rpm",
    "tpm",
] as const;

const GENERAL_QUOTA_SIGNALS = [
    "quota",
    "429",
    "retryinfo",
    "rate limit",
    "resource_exhausted",
] as const;

export type QuotaType = "daily" | "minute" | "none";

/**
 * Returns the quota type that caused an error, or "none" if not quota-related.
 */
export function detectQuotaType(err: unknown): QuotaType {
    const raw = normaliseErrMsg(err);

    // Daily quota signals take priority
    if (DAILY_QUOTA_SIGNALS.some((sig) => raw.includes(sig))) return "daily";

    // Minute quota
    if (MINUTE_QUOTA_SIGNALS.some((sig) => raw.includes(sig))) return "minute";

    // Check HTTP status code on error objects
    const status = (err as any)?.status ?? (err as any)?.statusCode ?? (err as any)?.code;
    if (status === 429 || status === "429") {
        return "minute"; // default 429 with no detail → minute limit
    }

    // General quota signal
    if (GENERAL_QUOTA_SIGNALS.some((sig) => raw.includes(sig))) return "minute";

    return "none";
}

/** Convenience predicate */
export function isQuotaExceeded(err: unknown): boolean {
    return detectQuotaType(err) !== "none";
}

/**
 * Parse the retry delay in milliseconds from a Gemini error message.
 * Returns 0 if no delay is found.
 *
 * Supports:
 *  - "retry in 43 seconds"
 *  - "retry after 35 seconds"
 *  - retryDelay:"35s"
 *  - Retry-After: 60
 */
export function parseRetryDelayMs(err: unknown): number {
    const msg = normaliseErrMsg(err);

    // Pattern: retry in / retry after N seconds
    const secMatch = msg.match(/retry(?:\s+in|\s+after)?\s+(\d+)\s*s(?:ec(?:ond)?s?)?/i);
    if (secMatch?.[1]) return parseInt(secMatch[1], 10) * 1000;

    // Pattern: retryDelay:"Ns"
    const delayMatch = msg.match(/retrydelay["\s:]+(\d+)s/i);
    if (delayMatch?.[1]) return parseInt(delayMatch[1], 10) * 1000;

    // Pattern: retry-after header value (plain number of seconds)
    const headerMatch = msg.match(/retry-after:\s*(\d+)/i);
    if (headerMatch?.[1]) return parseInt(headerMatch[1], 10) * 1000;

    return 0;
}

/** Normalise an unknown error to a lower-cased string for matching */
function normaliseErrMsg(err: unknown): string {
    if (err instanceof Error) {
        const details = (err as any)?.details;
        return ((err.message + " ") + (details ? String(details) : "")).toLowerCase();
    }
    try {
        return JSON.stringify(err).toLowerCase();
    } catch {
        return String(err).toLowerCase();
    }
}
