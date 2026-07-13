import { describe, expect, it } from "vitest";
import { withRetry } from "../src/utils/retry";

describe("withRetry", () => {
  it("returns the value on first attempt", async () => {
    const { value, attempts } = await withRetry(async () => 42, {
      retries: 3,
      baseMs: 1,
    });
    expect(value).toBe(42);
    expect(attempts).toBe(1);
  });

  it("retries until it succeeds", async () => {
    let calls = 0;
    const { value, attempts } = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw new Error("boom");
        return "ok";
      },
      { retries: 5, baseMs: 1, jitter: false },
    );
    expect(value).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("throws after exhausting retries", async () => {
    await expect(
      withRetry(async () => { throw new Error("always"); }, {
        retries: 2,
        baseMs: 1,
        jitter: false,
      }),
    ).rejects.toThrow("always");
  });

  it("respects shouldRetry=false", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          throw new Error("fatal");
        },
        { retries: 5, baseMs: 1, shouldRetry: () => false },
      ),
    ).rejects.toThrow("fatal");
    expect(calls).toBe(1);
  });
});
