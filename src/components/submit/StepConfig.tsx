import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useCustomPresets, type Product, type CustomPreset } from "@/hooks/useApiData";
import { STANDARD_PRESET } from "@/lib/standardPreset";

export interface ResolvedPreset {
  id: string;          // preset_id used at submit
  name: string;
  description?: string;
  source: "system" | "custom" | "builtin";
}

export function filterPresetsForProduct(
  custom: CustomPreset[],
  product: Product,
): { system: ResolvedPreset[]; custom: ResolvedPreset[]; builtin: ResolvedPreset[] } {
  const system: ResolvedPreset[] = [
    {
      id: STANDARD_PRESET.preset_id,
      name: STANDARD_PRESET.name,
      description: STANDARD_PRESET.description,
      source: "system",
    },
  ];

  const matchedCustom = custom
    .filter((p) => Array.isArray(p.for_product_types) && p.for_product_types.includes(product.id))
    .map<ResolvedPreset>((p) => ({
      id: p.preset_id,
      name: p.name,
      description: p.description,
      source: "custom",
    }));

  const builtin = (product.suggested_presets ?? []).map<ResolvedPreset>((id) => ({
    id,
    name: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "Suggested default",
    source: "builtin",
  }));

  return { system, custom: matchedCustom, builtin };
}

export function StepConfig({
  product,
  selectedPresetId,
  onSelect,
  onBack,
  onNext,
}: {
  product: Product;
  selectedPresetId?: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { data, isLoading } = useCustomPresets();

  const { custom, builtin } = useMemo(
    () => filterPresetsForProduct(data?.presets ?? [], product),
    [data, product],
  );

  const noConfigs = !isLoading && custom.length === 0 && builtin.length === 0;

  return (
    <div className="space-y-6">
      {isLoading && <Skeleton className="h-40" />}

      {custom.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Your configurations</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {custom.map((p) => (
              <PresetCard key={p.id} preset={p} selected={selectedPresetId === p.id} onClick={() => onSelect(p.id)} />
            ))}
          </div>
        </div>
      )}

      {builtin.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Suggested defaults</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {builtin.map((p) => (
              <PresetCard key={p.id} preset={p} selected={selectedPresetId === p.id} onClick={() => onSelect(p.id)} />
            ))}
          </div>
        </div>
      )}

      {noConfigs && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No configurations available for this product. Ask your admin to create one in{" "}
            <Link to="/dashboard/configurations" className="text-primary underline">
              Configurations
            </Link>.
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!selectedPresetId}>Next</Button>
      </div>
    </div>
  );
}

function PresetCard({
  preset,
  selected,
  onClick,
}: {
  preset: ResolvedPreset;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left focus:outline-none">
      <Card className={selected ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{preset.name}</CardTitle>
            <Badge variant={preset.source === "custom" ? "default" : "outline"}>
              {preset.source === "custom" ? "Yours" : "Default"}
            </Badge>
          </div>
          {preset.description && <CardDescription>{preset.description}</CardDescription>}
        </CardHeader>
      </Card>
    </button>
  );
}
