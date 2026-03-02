import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, CheckCircle, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSubmitJob } from "@/hooks/useApiData";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/tiff",
  "image/png",
  "image/jpeg",
  "application/postscript",
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function SubmitJob() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const submitJob = useSubmitJob();

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|tiff?|png|jpe?g|eps|ai)$/i)) {
      return "Unsupported file type. Please upload a PDF, TIFF, PNG, JPEG, EPS, or AI file.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 100MB.";
    }
    return null;
  };

  const handleFile = (f: File) => {
    const error = validateFile(f);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    try {
      const result = await submitJob.mutateAsync(file);
      toast.success("Job submitted successfully!");
      navigate(`/dashboard/jobs/${result.id}`);
    } catch {
      toast.error("Failed to submit job. Please try again.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submit Job</h1>
        <p className="text-muted-foreground">Upload a print file for preflight checking</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Upload File</CardTitle>
          <CardDescription>
            Supported formats: PDF, TIFF, PNG, JPEG, EPS, AI — Max 100MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drag & drop your file here, or{" "}
                  <span className="text-primary underline underline-offset-2">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, TIFF, PNG, JPEG, EPS, AI up to 100MB
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.tiff,.tif,.png,.jpg,.jpeg,.eps,.ai"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <FileUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Ready
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {submitJob.isPending && (
                <div className="space-y-2">
                  <Progress value={undefined} className="h-2" />
                  <p className="text-sm text-muted-foreground">Uploading and processing…</p>
                </div>
              )}

              {submitJob.isError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Upload failed. Please try again.</span>
                </div>
              )}

              {submitJob.isSuccess && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Job submitted! Redirecting…</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitJob.isPending}
                  className="flex-1"
                >
                  {submitJob.isPending ? "Submitting…" : "Submit for Preflight"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    submitJob.reset();
                  }}
                  disabled={submitJob.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
