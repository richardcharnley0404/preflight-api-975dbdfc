import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useArtworkUpload, readPdfPageCount, validatePageCount } from "@/hooks/useArtworkUpload";
import type { Product, ProductFileSlot } from "@/hooks/useApiData";

export interface UploadedSlotFile {
  url: string;
  filename: string;
  pages: number;
}

export type FilesByRole = Record<string, UploadedSlotFile>;

function humanize(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StepFiles({
  product,
  files,
  setFiles,
  onBack,
  onNext,
}: {
  product: Product;
  files: FilesByRole;
  setFiles: (f: FilesByRole) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const allRequiredFilled = product.files
    .filter((s) => s.required !== false)
    .every((s) => files[s.role]);

  return (
    <div className="space-y-4">
      {product.files.map((slot) => (
        <FileSlot
          key={slot.role}
          slot={slot}
          file={files[slot.role]}
          onUploaded={(f) => setFiles({ ...files, [slot.role]: f })}
          onClear={() => {
            const next = { ...files };
            delete next[slot.role];
            setFiles(next);
          }}
        />
      ))}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!allRequiredFilled}>Next</Button>
      </div>
    </div>
  );
}

function FileSlot({
  slot,
  file,
  onUploaded,
  onClear,
}: {
  slot: ProductFileSlot;
  file?: UploadedSlotFile;
  onUploaded: (f: UploadedSlotFile) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress } = useArtworkUpload();
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const required = slot.required !== false;

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    setError(null);
    try {
      setValidating(true);
      const pages = await readPdfPageCount(f);
      const validationError = validatePageCount(pages, slot);
      if (validationError) {
        setError(validationError);
        return;
      }
      setValidating(false);
      const result = await upload(f);
      onUploaded({ url: result.url, filename: result.filename, pages });
      toast.success(`${f.name} uploaded`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setValidating(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {humanize(slot.role)} {required && <span className="text-destructive">*</span>}
          </CardTitle>
          <Badge variant="outline">{slot.role}</Badge>
        </div>
        {slot.help && <CardDescription>{slot.help}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handle}
        />
        {file ? (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.filename}</p>
              <p className="text-xs text-muted-foreground">{file.pages} pages</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClear} aria-label="Remove file">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || validating}
            >
              {uploading || validating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {validating ? "Checking…" : `Uploading… ${progress}%`}</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Choose PDF</>
              )}
            </Button>
            {uploading && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
            )}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
