import { describe, it, expect } from "vitest";
import { validatePageCount } from "@/hooks/useArtworkUpload";

describe("validatePageCount", () => {
  it("rejects when below min_pages", () => {
    expect(validatePageCount(2, { min_pages: 4 })).toMatch(/at least 4/);
  });

  it("rejects when above max_pages", () => {
    expect(validatePageCount(20, { max_pages: 8 })).toMatch(/at most 8/);
  });

  it("rejects when not divisible", () => {
    expect(validatePageCount(7, { page_count_divisible_by: 4 })).toMatch(/divisible by 4/);
  });

  it("rejects when not exact", () => {
    expect(validatePageCount(3, { exact_pages: 4 })).toMatch(/exactly 4/);
  });

  it("accepts valid count", () => {
    expect(validatePageCount(8, { min_pages: 4, page_count_divisible_by: 4 })).toBeNull();
  });
});
