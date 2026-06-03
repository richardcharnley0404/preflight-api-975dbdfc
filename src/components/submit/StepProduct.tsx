import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, FileText, Layers, BookOpen, Image as ImageIcon } from "lucide-react";
import { useProducts, type Product } from "@/hooks/useApiData";

function iconFor(p: Product) {
  const b = p.binding || p.id;
  if (b.includes("case")) return Book;
  if (b.includes("perfect")) return BookOpen;
  if (b.includes("saddle")) return Layers;
  if (b.includes("leaflet")) return FileText;
  return ImageIcon;
}

export function StepProduct({
  onPick,
}: {
  onPick: (p: Product) => void;
}) {
  const { data, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (error || !data?.products?.length) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "No products available."}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.products.map((p) => {
        const Icon = iconFor(p);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            <Card className="h-full transition-colors hover:border-primary hover:bg-accent/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{p.description}</CardDescription>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
