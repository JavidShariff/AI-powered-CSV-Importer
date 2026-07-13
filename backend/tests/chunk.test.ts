import { describe, expect, it } from "vitest";
import { chunk } from "../src/utils/chunk";

describe("chunk", () => {
  it("splits an array into fixed-size batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns [] for empty input", () => {
    expect(chunk<number>([], 5)).toEqual([]);
  });

  it("throws on invalid size", () => {
    expect(() => chunk([1], 0)).toThrow();
  });
});
