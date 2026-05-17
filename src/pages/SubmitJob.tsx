import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, Upload, Loader2, BookOpen, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface PresetEntry {
  id: string;
  name: string;
  description: string;
  spec: {
    units: "mm" | "inches";
    pages: Array<{
      type: "combined" | "front" | "back";
      range: string;
      trim: { width: number; height: number };
      bleed: { left: number; right: number; top: number; bottom: number };
      safe_zone: { left: number; right: number; top: number; bottom: number };
    }>;
    page_count?: { min?: number; max?: number; must_be_even?: boolean };
    min_dpi?: number;
    colour_space?: "any" | "cmyk" | "rgb";
    font_check?: boolean;
    dimension_tolerance_mm?: number;
  };
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSubmitJob, type SubmitJobPayload } from "@/hooks/useApiData";

// ─── Schema ───

const pageSchema = z.object({
  label: z.string().optional(),
  type: z.enum(["combined", "front", "back"]),
  range: z.string().min(1, "Required"),
  trim: z.object({
    width: z.coerce.number().positive("Must be > 0"),
    height: z.coerce.number().positive("Must be > 0"),
  }),
  bleed: z.object({
    left: z.coerce.number().min(0),
    right: z.coerce.number().min(0),
    top: z.coerce.number().min(0),
    bottom: z.coerce.number().min(0),
  }),
  safe_zone: z.object({
    left: z.coerce.number().min(0),
    right: z.coerce.number().min(0),
    top: z.coerce.number().min(0),
    bottom: z.coerce.number().min(0),
  }),
});

const formSchema = z.object({
  job_id: z.string().optional(),
  artwork_url: z.string().url("Must be a valid URL"),
  artwork_filename: z.string().min(1, "Required"),
  proof_generate: z.boolean(),
  proof_expires_hours: z.coerce.number().int().positive().optional(),
  units: z.enum(["mm", "inches"]),
  min_dpi: z.coerce.number().int().positive(),
  colour_space: z.enum(["any", "cmyk", "rgb"]),
  font_check: z.boolean(),
  dimension_tolerance_mm: z.coerce.number().positive(),
  page_count_min: z.coerce.number().int().positive(),
  page_count_max: z.coerce.number().int().positive(),
  page_count_must_be_even: z.boolean(),
  pages: z.array(pageSchema).min(1, "At least one page spec is required"),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Preset page specs ───

const COVER_PAGE = {
  label: "Cover",
  type: "combined" as const,
  range: "1",
  trim: { width: 425, height: 297 },
  bleed: { left: 3, right: 3, top: 3, bottom: 3 },
  safe_zone: { left: 10, right: 10, top: 10, bottom: 10 },
};

const TEXT_PAGE = {
  label: "Text Pages",
  type: "combined" as const,
  range: "2-end",
  trim: { width: 210, height: 297 },
  bleed: { left: 3, right: 3, top: 3, bottom: 3 },
  safe_zone: { left: 5, right: 5, top: 5, bottom: 5 },
};

const DEFAULT_PAGE = {
  label: "",
  type: "combined" as const,
  range: "all",
  trim: { width: 210, height: 297 },
  bleed: { left: 3, right: 3, top: 3, bottom: 3 },
  safe_zone: { left: 5, right: 5, top: 5, bottom: 5 },
};

const SADDLE_STITCHED_PAGE = {
  label: "All Pages",
  type: "combined" as const,
  range: "all",
  trim: { width: 210, height: 297 },
  bleed: { left: 3, right: 3, top: 3, bottom: 3 },
  safe_zone: { left: 5, right: 5, top: 5, bottom: 5 },
};

const DEFAULTS: FormValues = {
  job_id: "",
  artwork_url: "",
  artwork_filename: "",
  proof_generate: false,
  proof_expires_hours: 72,
  units: "mm",
  min_dpi: 300,
  colour_space: "any",
  font_check: false,
  dimension_tolerance_mm: 0.5,
  page_count_min: 1,
  page_count_max: 100,
  page_count_must_be_even: false,
  pages: [DEFAULT_PAGE],
};

// ─── Helpers ───

function buildPayload(v: FormValues): SubmitJobPayload {
  const payload: SubmitJobPayload = {
    artwork: { url: v.artwork_url, filename: v.artwork_filename },
    spec: {
      units: v.units,
      pages: v.pages.map(({ label, ...rest }) => rest) as SubmitJobPayload["spec"]["pages"],
      page_count: {
        min: v.page_count_min,
        max: v.page_count_max,
        must_be_even: v.page_count_must_be_even,
      },
      min_dpi: v.min_dpi,
      colour_space: v.colour_space,
      font_check: v.font_check,
      dimension_tolerance_mm: v.dimension_tolerance_mm,
    },
  };
  if (v.job_id) payload.job_id = v.job_id;
  payload.proof = { generate: v.proof_generate, expires_hours: v.proof_expires_hours || 24 };
  return payload;
}

function trimSummary(trim: { width?: number; height?: number }, units: string) {
  return `${trim.width ?? 0}×${trim.height ?? 0}${units}`;
}

// ─── Component ───

export default function SubmitJob() {
  const navigate = useNavigate();
  const submitJob = useSubmitJob();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openSpecs, setOpenSpecs] = useState<Record<number, boolean>>({0: true});

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULTS,
  });

  const { data: presetsData } = useQuery({
    queryKey: ["presets"],
    queryFn: () => apiGet<{ presets: PresetEntry[] }>("/api/presets"),
    staleTime: 60 * 60 * 1000,
  });

  function applyPreset(p: PresetEntry) {
    if (p.spec.units) setValue("units", p.spec.units);
    if (p.spec.min_dpi) setValue("min_dpi", p.spec.min_dpi);
    if (p.spec.colour_space) setValue("colour_space", p.spec.colour_space);
    if (typeof p.spec.font_check === "boolean") setValue("font_check", p.spec.font_check);
    if (p.spec.dimension_tolerance_mm) setValue("dimension_tolerance_mm", p.spec.dimension_tolerance_mm);
    if (p.spec.page_count?.min) setValue("page_count_min", p.spec.page_count.min);
    if (p.spec.page_count?.max) setValue("page_count_max", p.spec.page_count.max);
    if (p.spec.page_count?.must_be_even !== undefined) {
      setValue("page_count_must_be_even", p.spec.page_count.must_be_even);
    }
    setValue("pages", p.spec.pages.map((pg) => ({ ...pg, label: "" })));
    toast.success(`Preset loaded: ${p.name}`);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const path = `${session.user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("artwork").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("artwork").getPublicUrl(path);
      setValue("artwork_url", publicUrl);
      setValue("artwork_filename", file.name);
      toast.success("PDF uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const { fields, append, remove, replace } = useFieldArray({ control, name: "pages" });

  const units = watch("units");

  const applyPreset = (preset: "perfect-bound" | "saddle-stitched") => {
    if (preset === "perfect-bound") {
      replace([COVER_PAGE, TEXT_PAGE]);
      setOpenSpecs({ 0: true, 1: true });
    } else {
      replace([SADDLE_STITCHED_PAGE]);
      setOpenSpecs({ 0: true });
    }
  };

  const addSpec = (type: "cover" | "text" | "custom") => {
    const newIndex = fields.length;
    if (type === "cover") {
      append({ ...COVER_PAGE });
    } else if (type === "text") {
      append({ ...TEXT_PAGE, range: `${fields.length + 1}-end` });
    } else {
      append({ ...DEFAULT_PAGE });
    }
    setOpenSpecs(prev => ({ ...prev, [newIndex]: true }));
  };

  const toggleSpec = (index: number) => {
    setOpenSpecs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = buildPayload(values);
      const result = await submitJob.mutateAsync(payload);

      // Job row is now created server-side in submit-job edge function
      // Query it by job_id to get the DB row id for navigation
      const { data: jobRow } = await supabase
        .from("jobs")
        .select("id")
        .eq("job_id", result.job_id)
        .single();

      toast.success("Job submitted successfully!");
      navigate(jobRow ? `/dashboard/jobs/${jobRow.id}` : "/dashboard/jobs");
    } catch {
      toast.error("Failed to submit job. Please try again.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Submit Job</h1>
        <p className="text-muted-foreground">Configure and submit a preflight job</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Artwork */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Artwork</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload PDF</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Choose PDF</>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">or enter a URL below</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Job ID (optional)</Label>
                <Input {...register("job_id")} placeholder="e.g. test-002" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Artwork URL *</Label>
                <Input {...register("artwork_url")} placeholder="https://..." />
                {errors.artwork_url && (
                  <p className="text-sm text-destructive">{errors.artwork_url.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Filename *</Label>
                <Input {...register("artwork_filename")} placeholder="file.pdf" />
                {errors.artwork_filename && (
                  <p className="text-sm text-destructive">{errors.artwork_filename.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Proof Viewer</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={watch("proof_generate")}
                onCheckedChange={(v) => setValue("proof_generate", v)}
              />
              <Label>Generate proof viewer</Label>
            </div>
            {watch("proof_generate") && (
              <div className="space-y-1">
                <Label>Expiry (hours)</Label>
                <Input
                  type="number"
                  className="w-24"
                  {...register("proof_expires_hours")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Units</Label>
                <Select
                  value={watch("units")}
                  onValueChange={(v) => setValue("units", v as "mm" | "inches")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="inches">inches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Min DPI</Label>
                <Input type="number" {...register("min_dpi")} />
                {errors.min_dpi && <p className="text-sm text-destructive">{errors.min_dpi.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Colour Space</Label>
                <Select
                  value={watch("colour_space")}
                  onValueChange={(v) => setValue("colour_space", v as "any" | "cmyk" | "rgb")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="cmyk">CMYK</SelectItem>
                    <SelectItem value="rgb">RGB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={watch("font_check")}
                  onCheckedChange={(v) => setValue("font_check", v)}
                />
                <Label>Font check</Label>
              </div>
              <div className="space-y-2">
                <Label>Dimension tolerance (mm)</Label>
                <Input type="number" step="0.1" {...register("dimension_tolerance_mm")} />
              </div>
            </div>

            {/* Page Count */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Page Count</Label>
              <div className="grid gap-4 sm:grid-cols-3 mt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input type="number" {...register("page_count_min")} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input type="number" {...register("page_count_max")} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch
                    checked={watch("page_count_must_be_even")}
                    onCheckedChange={(v) => setValue("page_count_must_be_even", v)}
                  />
                  <Label>Must be even</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Page Specifications</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Define different specs per page range — e.g. cover vs text pages
              </p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-1" /> Presets <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => applyPreset("perfect-bound")}>
                    Perfect Bound Book (A4)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyPreset("saddle-stitched")}>
                    Saddle-Stitched Booklet (A4)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => addSpec("cover")}>
                    Cover Spec
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSpec("text")}>
                    Text Pages Spec
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => addSpec("custom")}>
                    Custom
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.pages?.root && (
              <p className="text-sm text-destructive">{errors.pages.root.message}</p>
            )}
            {fields.map((field, i) => {
              const isOpen = openSpecs[i] ?? false;
              const currentTrim = watch(`pages.${i}.trim`);
              const currentLabel = watch(`pages.${i}.label`);
              const currentRange = watch(`pages.${i}.range`);

              return (
                <Collapsible key={field.id} open={isOpen} onOpenChange={() => toggleSpec(i)}>
                  <div className="rounded-lg border">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm font-medium">
                              {currentLabel || `Spec ${i + 1}`}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {trimSummary(currentTrim, units)} · range: {currentRange}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(i);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4 border-t pt-4">
                        {/* Label */}
                        <div className="space-y-2">
                          <Label className="text-xs">Label (optional)</Label>
                          <Input
                            {...register(`pages.${i}.label`)}
                            placeholder='e.g. "Cover", "Text Pages"'
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={watch(`pages.${i}.type`)}
                              onValueChange={(v) =>
                                setValue(`pages.${i}.type`, v as "combined" | "front" | "back")
                              }
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="combined">Combined</SelectItem>
                                <SelectItem value="front">Front</SelectItem>
                                <SelectItem value="back">Back</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Range</Label>
                            <Input {...register(`pages.${i}.range`)} placeholder='e.g. "all" or "1-4"' />
                          </div>
                        </div>

                        {/* Trim */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Trim</Label>
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            <Input type="number" step="0.1" placeholder="Width" {...register(`pages.${i}.trim.width`)} />
                            <Input type="number" step="0.1" placeholder="Height" {...register(`pages.${i}.trim.height`)} />
                          </div>
                        </div>

                        {/* Bleed */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Bleed</Label>
                          <div className="grid grid-cols-4 gap-2 mt-1">
                            <Input type="number" step="0.1" placeholder="L" {...register(`pages.${i}.bleed.left`)} />
                            <Input type="number" step="0.1" placeholder="R" {...register(`pages.${i}.bleed.right`)} />
                            <Input type="number" step="0.1" placeholder="T" {...register(`pages.${i}.bleed.top`)} />
                            <Input type="number" step="0.1" placeholder="B" {...register(`pages.${i}.bleed.bottom`)} />
                          </div>
                        </div>

                        {/* Safe Zone */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Safe Zone</Label>
                          <div className="grid grid-cols-4 gap-2 mt-1">
                            <Input type="number" step="0.1" placeholder="L" {...register(`pages.${i}.safe_zone.left`)} />
                            <Input type="number" step="0.1" placeholder="R" {...register(`pages.${i}.safe_zone.right`)} />
                            <Input type="number" step="0.1" placeholder="T" {...register(`pages.${i}.safe_zone.top`)} />
                            <Input type="number" step="0.1" placeholder="B" {...register(`pages.${i}.safe_zone.bottom`)} />
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={submitJob.isPending}>
            {submitJob.isPending ? "Submitting…" : "Submit Job"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard/jobs")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
