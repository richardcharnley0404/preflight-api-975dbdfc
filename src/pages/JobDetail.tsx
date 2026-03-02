import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface JobCheck {
  name: string;
  status: string;
  details: string;
}

function CheckIcon({ status }: { status: string }) {
  if (status === "pass") return <CheckCircle className="h-5 w-5 text-success" />;
  if (status === "fail") return <XCircle className="h-5 w-5 text-destructive" />;
  return <div className="h-5 w-5 rounded-full bg-warning" />;
}

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

  const checks: JobCheck[] = Array.isArray(job.checks) ? (job.checks as unknown as JobCheck[]) : [];
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
        {[
          { label: "Submitted", value: format(new Date(job.submitted_at), "MMM d, yyyy HH:mm") },
          { label: "Status", value: job.status },
          { label: "Completed", value: job.completed_at ? format(new Date(job.completed_at), "MMM d, yyyy HH:mm") : "—" },
          { label: "Proof URL", value: job.proof_url ? "Available" : "—" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-medium mt-1">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proof link */}
      {job.proof_url && (
        <Card>
          <CardContent className="pt-4">
            <a href={job.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              View Proof PDF
            </a>
          </CardContent>
        </Card>
      )}

      {/* Checks Breakdown */}
      {checks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Preflight Checks</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Download Report
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {checks.map((check) => (
                <div key={check.name} className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                  <CheckIcon status={check.status} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{check.name}</p>
                      {check.status === "warning" && (
                        <Badge variant="secondary" className="text-warning bg-warning/10 border-0">Warning</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{check.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {checks.length === 0 && job.status !== "completed" && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Preflight checks will appear here once the job completes.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
