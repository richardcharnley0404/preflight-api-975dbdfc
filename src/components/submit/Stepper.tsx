import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Product", "Files", "Configuration", "Review"];

export function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex items-center gap-2 text-sm">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium",
                done && "bg-primary text-primary-foreground border-primary",
                active && "border-primary text-primary",
                !done && !active && "text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : idx}
            </span>
            <span
              className={cn(
                "hidden sm:inline",
                active ? "font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {idx < STEPS.length && <span className="mx-2 text-muted-foreground">›</span>}
          </li>
        );
      })}
    </ol>
  );
}
