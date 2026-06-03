// System-wide "Print Pre-flight Standard" configuration.
// Frontend synthetic preset that's always available to every account
// and applies to every product, including products added in the future.
// On submit we send these values inline (no `spec.preset`) so the backend
// doesn't need to know about the ID.

export const STANDARD_PRESET_ID = "printpreflight_standard";

export const STANDARD_PRESET = {
  preset_id: STANDARD_PRESET_ID,
  name: "Print Pre-flight Standard",
  description: "System default — applies to all products",
  spec: {
    units: "mm" as const,
    min_dpi: 300,
    colour_space: "cmyk" as const,
    font_check: true,
    bleed_default: 3,
    safe_zone_default: 5,
    dimension_tolerance_mm: 0.5,
    // Default trim used to build per-page specs at submit time (A4)
    trim_default: { width: 210, height: 297 },
  },
} as const;

export function isStandardPreset(id: string | undefined): boolean {
  return id === STANDARD_PRESET_ID;
}
