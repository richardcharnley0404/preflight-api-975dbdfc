import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useProducts, useCreateCustomPreset, useUpdateCustomPreset, type CustomPreset } from "@/hooks/useApiData";

const formSchema = z.object({
  preset_id: z.string().min(1, "Required").regex(/^[a-z0-9_-]+$/, "Use lowercase letters, numbers, _ or -"),
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  for_product_types: z.array(z.string()).min(1, "Pick at least one"),
  units: z.enum(["mm", "inches"]),
  min_dpi: z.coerce.number().int().positive(),
  colour_space: z.enum(["any", "cmyk", "rgb"]),
  font_check: z.boolean(),
  dimension_tolerance_mm: z.coerce.number().min(0),
  bleed_default: z.coerce.number().min(0),
  safe_zone_default: z.coerce.number().min(0),
  page_count_enabled: z.boolean(),
  page_count_min: z.coerce.number().int().positive().optional(),
  page_count_max: z.coerce.number().int().positive().optional(),
  page_count_must_be_even: z.boolean().optional(),
  tac_max_enabled: z.boolean(),
  tac_max: z.coerce.number().int().positive().optional(),
  min_stroke_pt_enabled: z.boolean(),
  min_stroke_pt: z.coerce.number().positive().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function defaultsFromPreset(p?: CustomPreset): FormValues {
  const spec = (p?.spec ?? {}) as Record<string, unknown>;
  const pc = (spec.page_count as Record<string, unknown> | undefined) ?? undefined;
  return {
    preset_id: p?.preset_id ?? "",
    name: p?.name ?? "",
    description: p?.description ?? "",
    for_product_types: p?.for_product_types ?? [],
    units: (spec.units as "mm" | "inches") ?? "mm",
    min_dpi: (spec.min_dpi as number) ?? 300,
    colour_space: (spec.colour_space as "any" | "cmyk" | "rgb") ?? "cmyk",
    font_check: (spec.font_check as boolean) ?? true,
    dimension_tolerance_mm: (spec.dimension_tolerance_mm as number) ?? 0.5,
    bleed_default: (spec.bleed_default as number) ?? 3,
    safe_zone_default: (spec.safe_zone_default as number) ?? 5,
    page_count_enabled: !!pc,
    page_count_min: (pc?.min as number) ?? undefined,
    page_count_max: (pc?.max as number) ?? undefined,
    page_count_must_be_even: (pc?.must_be_even as boolean) ?? false,
    tac_max_enabled: spec.tac_max !== undefined,
    tac_max: (spec.tac_max as number) ?? undefined,
    min_stroke_pt_enabled: spec.min_stroke_pt !== undefined,
    min_stroke_pt: (spec.min_stroke_pt as number) ?? undefined,
  };
}

function buildSpec(v: FormValues): Record<string, unknown> {
  const spec: Record<string, unknown> = {
    units: v.units,
    min_dpi: v.min_dpi,
    colour_space: v.colour_space,
    font_check: v.font_check,
    dimension_tolerance_mm: v.dimension_tolerance_mm,
    bleed_default: v.bleed_default,
    safe_zone_default: v.safe_zone_default,
  };
  if (v.page_count_enabled) {
    spec.page_count = {
      min: v.page_count_min,
      max: v.page_count_max,
      must_be_even: v.page_count_must_be_even ?? false,
    };
  }
  if (v.tac_max_enabled && v.tac_max) spec.tac_max = v.tac_max;
  if (v.min_stroke_pt_enabled && v.min_stroke_pt) spec.min_stroke_pt = v.min_stroke_pt;
  return spec;
}

export function ConfigurationDialog({
  open,
  onOpenChange,
  preset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preset?: CustomPreset;
}) {
  const { data: productsData } = useProducts();
  const createMut = useCreateCustomPreset();
  const updateMut = useUpdateCustomPreset();
  const isEdit = !!preset;
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFromPreset(preset),
  });

  useEffect(() => {
    if (open) form.reset(defaultsFromPreset(preset));
  }, [open, preset, form]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const selectedProductTypes = watch("for_product_types");
  const name = watch("name");

  // Auto-slug preset_id on create
  useEffect(() => {
    if (!isEdit && name) {
      const current = form.getValues("preset_id");
      const slug = slugify(name);
      if (!current || current === slugify(form.formState.defaultValues?.name ?? "")) {
        form.setValue("preset_id", slug);
      }
    }
  }, [name, isEdit, form]);

  const onSubmit = async (v: FormValues) => {
    try {
      const body = {
        preset_id: v.preset_id,
        name: v.name,
        description: v.description,
        spec: buildSpec(v),
        for_product_types: v.for_product_types,
      };
      if (isEdit) {
        await updateMut.mutateAsync({ ...body, preset_id: preset!.preset_id });
        toast.success("Configuration updated");
      } else {
        await createMut.mutateAsync(body);
        toast.success("Configuration created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  const toggleProduct = (id: string) => {
    const next = selectedProductTypes.includes(id)
      ? selectedProductTypes.filter((x) => x !== id)
      : [...selectedProductTypes, id];
    setValue("for_product_types", next, { shouldValidate: true });
  };

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit configuration" : "New configuration"}</DialogTitle>
          <DialogDescription>
            Reusable preflight spec. Customers will pick from these when submitting jobs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...register("name")} placeholder="Our Standard Brochure" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>ID</Label>
              <Input {...register("preset_id")} disabled={isEdit} placeholder="our_standard_brochure" />
              {errors.preset_id && <p className="text-xs text-destructive">{errors.preset_id.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Input {...register("description")} placeholder="300 DPI CMYK, 3mm bleed" />
          </div>

          <div className="space-y-1">
            <Label>Applies to products</Label>
            <div className="rounded-md border p-3 grid gap-2 sm:grid-cols-2 max-h-40 overflow-y-auto">
              {productsData?.products?.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedProductTypes.includes(p.id)}
                    onCheckedChange={() => toggleProduct(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            {errors.for_product_types && <p className="text-xs text-destructive">{errors.for_product_types.message}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Units</Label>
              <Select value={watch("units")} onValueChange={(v) => setValue("units", v as "mm" | "inches")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="inches">inches</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Min DPI</Label>
              <Input type="number" {...register("min_dpi")} />
            </div>
            <div className="space-y-1">
              <Label>Colour space</Label>
              <Select value={watch("colour_space")} onValueChange={(v) => setValue("colour_space", v as "any" | "cmyk" | "rgb")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="cmyk">CMYK</SelectItem>
                  <SelectItem value="rgb">RGB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Bleed default ({watch("units")})</Label>
              <Input type="number" step="0.1" {...register("bleed_default")} />
            </div>
            <div className="space-y-1">
              <Label>Safe zone default ({watch("units")})</Label>
              <Input type="number" step="0.1" {...register("safe_zone_default")} />
            </div>
            <div className="space-y-1">
              <Label>Dimension tolerance (mm)</Label>
              <Input type="number" step="0.1" {...register("dimension_tolerance_mm")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={watch("font_check")} onCheckedChange={(v) => setValue("font_check", v)} />
            <Label>Font check</Label>
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="px-0">
                Advanced <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={watch("page_count_enabled")} onCheckedChange={(v) => setValue("page_count_enabled", v)} />
                  <Label>Enforce page count</Label>
                </div>
                {watch("page_count_enabled") && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Min</Label>
                      <Input type="number" {...register("page_count_min")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max</Label>
                      <Input type="number" {...register("page_count_max")} />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <Switch checked={!!watch("page_count_must_be_even")} onCheckedChange={(v) => setValue("page_count_must_be_even", v)} />
                      <Label>Must be even</Label>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={watch("tac_max_enabled")} onCheckedChange={(v) => setValue("tac_max_enabled", v)} />
                  <Label>Enforce TAC max</Label>
                </div>
                {watch("tac_max_enabled") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Total area coverage (%)</Label>
                    <Input type="number" {...register("tac_max")} />
                  </div>
                )}
              </div>

              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={watch("min_stroke_pt_enabled")} onCheckedChange={(v) => setValue("min_stroke_pt_enabled", v)} />
                  <Label>Enforce minimum stroke width</Label>
                </div>
                {watch("min_stroke_pt_enabled") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Min stroke (pt)</Label>
                    <Input type="number" step="0.1" {...register("min_stroke_pt")} />
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
