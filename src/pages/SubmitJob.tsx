import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSubmitJob, type SubmitJobPayload, type Product } from "@/hooks/useApiData";
import { Stepper } from "@/components/submit/Stepper";
import { StepProduct } from "@/components/submit/StepProduct";
import { StepFiles, type FilesByRole } from "@/components/submit/StepFiles";
import { StepConfig } from "@/components/submit/StepConfig";
import { STANDARD_PRESET, isStandardPreset } from "@/lib/standardPreset";
import { StepReview } from "@/components/submit/StepReview";

const STEP_TITLES = {
  1: "What are you printing?",
  2: "Upload your files",
  3: "Pick a configuration",
  4: "Review and submit",
} as const;

export default function SubmitJob() {
  const navigate = useNavigate();
  const submitJob = useSubmitJob();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [product, setProduct] = useState<Product | undefined>();
  const [files, setFiles] = useState<FilesByRole>({});
  const [presetId, setPresetId] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!product || !presetId) return;
    const artwork = Object.entries(files).map(([role, f]) => ({
      url: f.url,
      filename: f.filename,
      role,
    }));
    const payload: SubmitJobPayload = {
      job_id: `job-${Date.now()}`,
      artwork,
      proof: { generate: true, thumbnails: { count: 4 } },
      spec: isStandardPreset(presetId)
        ? { product: { type: product.id }, ...STANDARD_PRESET.spec }
        : { preset: presetId, product: { type: product.id } },
    };
    try {
      const result = await submitJob.mutateAsync(payload);
      const { data: jobRow } = await supabase
        .from("jobs")
        .select("id")
        .eq("job_id", result.job_id)
        .single();
      toast.success("Job submitted");
      navigate(jobRow ? `/dashboard/jobs/${jobRow.id}` : "/dashboard/jobs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit job");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Submit Job</h1>
        <p className="text-muted-foreground">{STEP_TITLES[step]}</p>
      </div>

      <Stepper step={step} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STEP_TITLES[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <StepProduct
              onPick={(p) => {
                setProduct(p);
                setFiles({});
                setPresetId(undefined);
                setStep(2);
              }}
            />
          )}
          {step === 2 && product && (
            <StepFiles
              product={product}
              files={files}
              setFiles={setFiles}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && product && (
            <StepConfig
              product={product}
              selectedPresetId={presetId}
              onSelect={setPresetId}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && product && presetId && (
            <StepReview
              product={product}
              files={files}
              presetId={presetId}
              submitting={submitJob.isPending}
              onBack={() => setStep(3)}
              onSubmit={handleSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
