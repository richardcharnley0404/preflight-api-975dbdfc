import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// ─── Types matching Railway's checks object ───

interface CheckEntry {
  passed: boolean;
  details?: { message: string }[];
  pages_failed?: { message: string }[];
  warnings?: { message: string }[];
  message?: string;
}

type ChecksMap = Record<string, CheckEntry>;

const CHECK_ORDER = [
  "dimensions",
  "page_count",
  "bleed",
  "safe_zone",
  "resolution",
  "colour_space",
  "fonts",
];

function formatCheckName(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getCheckMessages(entry: CheckEntry): string[] {
  const items = entry.details ?? entry.pages_failed ?? entry.warnings ?? [];
  const msgs = items
    .map((i) => (typeof i === "object" && i !== null ? (i as { message?: string }).message : undefined))
    .filter(Boolean) as string[];
  if (msgs.length === 0 && entry.message) msgs.push(entry.message);
  return msgs;
}

// ─── Components ───

function CheckRow({ name, entry }: { name: string; entry: CheckEntry }) {
  const [open, setOpen] = useState(false);
  const messages = entry.passed ? [] : getCheckMessages(entry);
  const hasDetails = messages.length > 0;
  const collapsed = messages.length > 3;

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
              <ul className="mt-1 space-y-0.5">
                {messages.slice(0, 3).map((m, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {m}</li>
                ))}
              </ul>
              <CollapsibleContent>
                <ul className="space-y-0.5">
                  {messages.slice(3).map((m, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {m}</li>
                  ))}
                </ul>
              </CollapsibleContent>
              <CollapsibleTrigger asChild>
                <button className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline">
                  {open ? "Show less" : `Show ${messages.length - 3} more`}
                  <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
            </Collapsible>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {messages.map((m, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {m}</li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

// ─── Page ───

export default function JobDetail() {
  const { jobId } = useParams();

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

  // Parse checks object
  const rawChecks = (job.checks && typeof job.checks === "object" && !Array.isArray(job.checks))
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
              <a href={job.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium mt-1 inline-block">
                View Proof
              </a>
            ) : (
              <p className="font-medium mt-1 text-muted-foreground">Not generated</p>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
