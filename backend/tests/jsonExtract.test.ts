import { describe, expect, it } from "vitest";
import { extractJson } from "../src/utils/jsonExtract";

describe("extractJson", () => {
  it("parses a clean JSON object", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips markdown code fences", () => {
    const raw = "```json\n{\"leads\":[]}\n```";
    expect(extractJson(raw)).toEqual({ leads: [] });
  });

  it("strips leading prose", () => {
    const raw = 'Here is the JSON: {"ok":true}';
    expect(extractJson(raw)).toEqual({ ok: true });
  });

  it("repairs trailing commas", () => {
    const raw = '{ "leads": [ {"a":1,}, ], }';
    expect(extractJson(raw)).toEqual({ leads: [{ a: 1 }] });
  });

  it("throws on empty input", () => {
    expect(() => extractJson("")).toThrow();
  });

  it("throws when no JSON present", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});
