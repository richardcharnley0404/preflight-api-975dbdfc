import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
}

const STEPS: Step[] = [
  { key: "processing_started", label: "Processing your artwork" },
  { key: "checking_artwork", label: "Checking your artwork" },
  { key: "proof_ready", label: "Proof ready" },
  { key: "job_completed", label: "Preflight complete" },
];

function indexFor(event: string | null, terminal: boolean): number {
  if (terminal) return STEPS.length - 1;
  const i = STEPS.findIndex((s) => s.key === event);
  return i < 0 ? -1 : i;
}

export function ProgressiveStatus({
  statusEvent,
  isTerminal,
  proofUrl,
}: {
  statusEvent: string | null;
  isTerminal: boolean;
  proofUrl?: string | null;
}) {
  const currentIndex = indexFor(statusEvent, isTerminal);

  return (
    <ol className="space-y-2">
      {STEPS.map((s, i) => {
        const done = i < currentIndex || (i === currentIndex && isTerminal);
        const active = i === currentIndex && !isTerminal;
        const pending = i > currentIndex;
        return (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                done && "bg-primary text-primary-foreground border-primary",
                active && "border-primary text-primary animate-pulse",
                pending && "text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                active && "font-medium",
                pending && "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
            {s.key === "proof_ready" && proofUrl && (done || active) && (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Review now <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
