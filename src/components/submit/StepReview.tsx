import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Product } from "@/hooks/useApiData";
import type { FilesByRole } from "./StepFiles";

export function StepReview({
  product,
  files,
  presetId,
  submitting,
  onBack,
  onSubmit,
}: {
  product: Product;
  files: FilesByRole;
  presetId: string;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Product</p>
            <p className="font-medium">{product.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Files</p>
            <ul className="space-y-2">
              {Object.entries(files).map(([role, f]) => (
                <li key={role} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{f.filename}</p>
                    <p className="text-xs text-muted-foreground">{f.pages} pages</p>
                  </div>
                  <Badge variant="outline">{role}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Configuration</p>
            <p className="font-medium">{presetId}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>Back</Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : "Submit for preflight"}
        </Button>
      </div>
    </div>
  );
}
