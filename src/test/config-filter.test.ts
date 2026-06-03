import { describe, it, expect } from "vitest";
import { filterPresetsForProduct } from "@/components/submit/StepConfig";
import type { CustomPreset, Product } from "@/hooks/useApiData";

const product: Product = {
  id: "saddle_stitched_self_cover",
  name: "Saddle-Stitched",
  description: "",
  files: [],
  suggested_presets: ["brochure_a4_saddle_stitched", "brochure_a5_saddle_stitched"],
};

const presets: CustomPreset[] = [
  {
    id: "1",
    preset_id: "our_brochure",
    name: "Our brochure",
    spec: {},
    for_product_types: ["saddle_stitched_self_cover"],
  },
  {
    id: "2",
    preset_id: "our_book",
    name: "Our book",
    spec: {},
    for_product_types: ["perfect_bound"],
  },
];

describe("filterPresetsForProduct", () => {
  it("returns custom presets matching product type", () => {
    const { custom } = filterPresetsForProduct(presets, product);
    expect(custom.map((p) => p.id)).toEqual(["our_brochure"]);
  });

  it("returns built-in suggested presets from the product", () => {
    const { builtin } = filterPresetsForProduct(presets, product);
    expect(builtin.map((p) => p.id)).toEqual([
      "brochure_a4_saddle_stitched",
      "brochure_a5_saddle_stitched",
    ]);
  });

  it("excludes presets that don't apply", () => {
    const { custom } = filterPresetsForProduct(presets, product);
    expect(custom.find((p) => p.id === "our_book")).toBeUndefined();
  });
});
