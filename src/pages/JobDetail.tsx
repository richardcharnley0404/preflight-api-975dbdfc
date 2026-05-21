import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ExternalLink, Download, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Types ───

interface CheckEntry {
  passed: boolean;
  details?: { message: string }[];
  pages_failed?: { message: string }[];
  warnings?: { message: string }[];
  message?: string;
}

type ChecksMap = Record<string, CheckEntry>;

interface PageIssue {
  check: string;
  severity: "fail" | "warning";
  message: string;
  edge?: string;
  bbox?: [number, number, number, number];
}

interface FixedArtwork {
  url: string;
  expires_at: string;
  fixes_applied: { check: string; pages: number[] }[];
}

interface FullResults {
  passed: boolean;
  summary?: {
    total_checks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  checks?: ChecksMap;
  page_issues?: Record<string, PageIssue[]>;
  fixed_artwork?: FixedArtwork | null;
  proof_url?: string | null;
}

const CHECK_ORDER = [
  "page_count",
  "dimensions",
  "bleed",
  "safe_zone",
  "resolution",
  "colour_space",
  "fonts",
  "tac",
  "spot_colours",
  "pdf_x",
  "hairline",
  "overprint",
];

function formatCheckName(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getMessages(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((i) => (typeof i === "object" && i !== null ? (i as { message?: string }).message : undefined))
    .filter(Boolean) as string[];
}

// ─── Check row ───

function CheckRow({ name, entry }: { name: string; entry: CheckEntry }) {
  const [open, setOpen] = useState(false);
  const failures = entry.passed ? [] : [...getMessages(entry.details), ...getMessages(entry.pages_failed)];
  if (!entry.passed && failures.length === 0 && entry.message) failures.push(entry.message);
  const warnings = getMessages(entry.warnings);
  const all = [
    ...failures.map((m) => ({ kind: "fail" as const, message: m })),
    ...warnings.map((m) => ({ kind: "warn" as const, message: m })),
  ];
  const hasDetails = all.length > 0;
  const collapsed = all.length > 3;

  const renderItem = (item: { kind: "fail" | "warn"; message: string }, i: number) =>
    item.kind === "warn" ? (
      <li key={i} className="text-sm text-amber-600">⚠ {item.message}</li>
    ) : (
      <li key={i} className="text-sm text-muted-foreground">• {item.message}</li>
    );

  return (
    <div className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
      {entry.passed ? (
        <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{name}</p>
        {hasDetails && (
          collapsed ? (
            <Collapsible open={open} onOpenChange={setOpen}>
              <ul className="mt-1 space-y-0.5">{all.slice(0, 3).map(renderItem)}</ul>
              <CollapsibleContent>
                <ul className="space-y-0.5">{all.slice(3).map((it, i) => renderItem(it, i + 3))}</ul>
              </CollapsibleContent>
              <CollapsibleTrigger asChild>
                <button className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline">
                  {open ? "Show less" : `Show ${all.length - 3} more`}
                  <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
            </Collapsible>
          ) : (
            <ul className="mt-1 space-y-0.5">{all.map(renderItem)}</ul>
          )
        )}
      </div>
    </div>
  );
}

// ─── Page ───

export default function JobDetail() {
  const { jobId } = useParams();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  useEffect(() => {
    if (!jobId) return;
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        () => queryClient.invalidateQueries({ queryKey: ["job", jobId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jobId, queryClient]);

  const retryMutation = useMutation({
    mutationFn: () => apiPost(`/api/jobs/${jobId}/retry`),
    onSuccess: () => {
      toast.success("Retry queued");
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Retry failed"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/dashboard/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const results: FullResults | null =
    job.results && typeof job.results === "object" && !Array.isArray(job.results)
      ? (job.results as unknown as FullResults)
      : null;

  const rawChecks: ChecksMap | null =
    results?.checks && typeof results.checks === "object"
      ? results.checks
      : job.checks && typeof job.checks === "object" && !Array.isArray(job.checks)
        ? (job.checks as unknown as ChecksMap)
        : null;

  const orderedChecks: [string, CheckEntry][] = rawChecks
    ? (CHECK_ORDER
        .filter((k) => k in rawChecks)
        .map((k): [string, CheckEntry] => [formatCheckName(k), rawChecks[k]])
        .concat(
          Object.keys(rawChecks)
            .filter((k) => !CHECK_ORDER.includes(k))
            .map((k): [string, CheckEntry] => [formatCheckName(k), rawChecks[k]])
        ))
    : [];

  const isPassed = job.passed === true;
  const fixed = results?.fixed_artwork;
  const summary = results?.summary;
  const errorMessage = (job as unknown as { error_message?: string }).error_message;

  const STUCK_MS = 5 * 60 * 1000;
  const submittedAgeMs = job.submitted_at ? Date.now() - new Date(job.submitted_at).getTime() : 0;
  const isStuck =
    (job.status === "queued" || job.status === "processing" || job.status === "pending") &&
    submittedAgeMs > STUCK_MS;
  const showRetry =
    job.status === "failed" ||
    isStuck ||
    (job.status === "completed" && job.webhook_delivered === false);
  const retryLabel =
    job.status === "failed"
      ? "Retry job"
      : isStuck
        ? "Re-queue job"
        : "Retry webhook";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/jobs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.filename || "Untitled"}</h1>
          <p className="text-muted-foreground font-mono text-sm">{job.job_id || job.id}</p>
        </div>
        {showRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            {retryLabel}
          </Button>
        )}
        {job.status === "completed" || job.completed_at ? (
          isPassed ? (
            <Badge className="bg-success text-success-foreground text-base px-4 py-1">Pass</Badge>
          ) : (
            <Badge variant="destructive" className="text-base px-4 py-1">Fail</Badge>
          )
        ) : (
          <Badge variant="secondary" className="text-base px-4 py-1">
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        )}
      </div>

      {/* Fixed artwork banner */}
      {fixed?.url && (
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">A fixed version of your artwork is available</CardTitle>
              {fixed.fixes_applied?.length > 0 && (
                <CardDescription className="mt-2">
                  Auto-fixed: {fixed.fixes_applied.map((f) => `${formatCheckName(f.check)} (pages ${f.pages.join(", ")})`).join("; ")}
                </CardDescription>
              )}
            </div>
            <Button asChild size="sm">
              <a href={fixed.url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1" /> Download
              </a>
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Metadata */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Submitted</p>
            <p className="font-medium mt-1">{format(new Date(job.submitted_at), "MMM d, yyyy HH:mm")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-medium mt-1">{job.status}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="font-medium mt-1">{job.completed_at ? format(new Date(job.completed_at), "MMM d, yyyy HH:mm") : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Proof URL</p>
            {job.proof_url ? (
              <Button variant="outline" size="sm" asChild className="mt-1">
                <a href={job.proof_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" /> View Proof
                </a>
              </Button>
            ) : (
              <p className="font-medium mt-1 text-muted-foreground">Not generated</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      {summary && (
        <Card>
          <CardContent className="pt-6 grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Checks run</p>
              <p className="text-2xl font-semibold mt-1">{summary.total_checks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Passed</p>
              <p className="text-2xl font-semibold mt-1 text-success">{summary.passed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-2xl font-semibold mt-1 text-destructive">{summary.failed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Warnings</p>
              <p className="text-2xl font-semibold mt-1 text-amber-600">{summary.warnings}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checks Breakdown */}
      {orderedChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preflight Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {orderedChecks.map(([name, entry]) => (
                <CheckRow key={name} name={name} entry={entry} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {orderedChecks.length === 0 && job.status !== "completed" && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Preflight checks will appear here once the job completes.
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {job.status === "failed" && errorMessage && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{errorMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
