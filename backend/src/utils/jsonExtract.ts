export class JsonParseError extends Error {
  constructor(message: string, public readonly rawText?: string) {
    super(message);
    this.name = "JsonParseError";
  }
}

/**
 * Attempt to repair truncated or slightly malformed JSON text (e.g. missing brackets/braces/quotes)
 */
export function tryRepairJson(text: string): string {
  let repaired = text.trim();

  // Count quotes
  const quotes = (repaired.match(/"/g) || []).length;
  if (quotes % 2 !== 0) {
    repaired += '"'; // close open string quote
  }

  // Balance braces and brackets using a stack
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }

    if (char === '{') {
      stack.push('}');
    } else if (char === '[') {
      stack.push(']');
    } else if (char === '}') {
      if (stack[stack.length - 1] === '}') {
        stack.pop();
      }
    } else if (char === ']') {
      if (stack[stack.length - 1] === ']') {
        stack.pop();
      }
    }
  }

  // Clean any trailing commas before appending the closing brace/bracket
  repaired = repaired.replace(/,\s*$/, "");
  repaired = repaired.replace(/,\s*([}\]])/g, "$1");

  // Append missing closing delimiters in reverse order
  while (stack.length > 0) {
    const missing = stack.pop();
    repaired += missing;
  }

  return repaired;
}

/**
 * Extract the first well-formed JSON value from an LLM response.
 * Handles common failure modes:
 *  - Fenced code blocks (```json ... ```)
 *  - Leading/trailing prose
 *  - Trailing commas
 *  - Truncated output (attempts automatic repair)
 */
export function extractJson<T = unknown>(raw: string): T {
  if (!raw || typeof raw !== "string") {
    throw new JsonParseError("Empty AI response", raw);
  }
  let text = raw.trim();

  // Strip fenced code blocks
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) {
    text = fence[1].trim();
  } else if (text.startsWith("```json")) {
    text = text.slice(7).trim();
  } else if (text.startsWith("```")) {
    text = text.slice(3).trim();
  }

  // Fast path
  try {
    return JSON.parse(text) as T;
  } catch {
    // fall through
  }

  // Slice from first { or [ to last matching } or ]
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  const start =
    firstArr === -1
      ? firstObj
      : firstObj === -1
        ? firstArr
        : Math.min(firstObj, firstArr);

  if (start === -1) {
    throw new JsonParseError("No JSON structure (array/object) found in AI response", raw);
  }

  const textToParse = text.slice(start);

  try {
    // Remove trailing commas before } or ]
    const cleaned = textToParse.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt automatic repair
    try {
      const repaired = tryRepairJson(textToParse);
      return JSON.parse(repaired) as T;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Parse failed";
      throw new JsonParseError(`Invalid/Truncated JSON generated and repair failed: ${msg}`, raw);
    }
  }
}
