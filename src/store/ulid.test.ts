import { describe, expect, it } from "vitest";
import { ulid } from "./ulid.js";

describe("ulid", () => {
  it("is 26 Crockford base32 characters", () => {
    expect(ulid(new Date())).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("starts with the time, so later ids sort after earlier ones", () => {
    const a = ulid(new Date("2026-11-10T12:00:00Z"));
    const b = ulid(new Date("2026-11-10T12:00:01Z"));
    expect(a.slice(0, 10) < b.slice(0, 10)).toBe(true);
  });

  it("differs between two ids made at the same time", () => {
    const now = new Date();
    expect(ulid(now)).not.toBe(ulid(now));
  });
});
