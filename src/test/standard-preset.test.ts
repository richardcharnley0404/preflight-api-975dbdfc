import { describe, it, expect } from "vitest";
import { STANDARD_PRESET, STANDARD_PRESET_ID, isStandardPreset } from "@/lib/standardPreset";

describe("STANDARD_PRESET", () => {
  it("has stable id and name", () => {
    expect(STANDARD_PRESET_ID).toBe("printpreflight_standard");
    expect(STANDARD_PRESET.preset_id).toBe(STANDARD_PRESET_ID);
    expect(STANDARD_PRESET.name).toBe("Print Pre-flight Standard");
  });

  it("has the documented spec defaults", () => {
    expect(STANDARD_PRESET.spec).toEqual({
      units: "mm",
      min_dpi: 300,
      colour_space: "cmyk",
      font_check: true,
      bleed_default: 3,
      safe_zone_default: 5,
      dimension_tolerance_mm: 0.5,
    });
  });

  it("isStandardPreset recognises the id", () => {
    expect(isStandardPreset(STANDARD_PRESET_ID)).toBe(true);
    expect(isStandardPreset("our_brochure")).toBe(false);
    expect(isStandardPreset(undefined)).toBe(false);
  });
});
