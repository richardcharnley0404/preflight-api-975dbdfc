import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, CheckCircle, XCircle } from "lucide-react";

// Mock data for a single job
const mockJob = {
  id: "job_001",
  filename: "brochure_v3.pdf",
  submittedBy: "user@company.com",
  submitted: "2026-03-01 14:32:00",
  processingTime: "2.4s",
  status: "complete",
  result: "fail",
  checks: [
    { name: "Font Embedding", status: "pass", details: "All fonts are embedded." },
    { name: "Color Space", status: "fail", details: "Page 3 contains RGB elements. Convert to CMYK." },
    { name: "Image Resolution", status: "pass", details: "All images ≥ 300 DPI." },
    { name: "Bleed Area", status: "pass", details: "3mm bleed detected on all sides." },
    { name: "Trim Marks", status: "pass", details: "Trim marks present." },
    { name: "Transparency", status: "pass", details: "No live transparency detected." },
    { name: "Overprint", status: "warning", details: "Overprint detected on page 2. Review recommended." },
    { name: "PDF/X Compliance", status: "fail", details: "File is not PDF/X-1a compliant. Missing output intent." },
  ],
};

function CheckIcon({ status }: { status: string }) {
  if (status === "pass") return <CheckCircle className="h-5 w-5 text-success" />;
  if (status === "fail") return <XCircle className="h-5 w-5 text-destructive" />;
  return <div className="h-5 w-5 rounded-full bg-warning" />;
}

export default function JobDetail() {
  const { jobId } = useParams();
  const job = mockJob; // In real app, fetch by jobId

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/jobs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.filename}</h1>
          <p className="text-muted-foreground font-mono text-sm">{jobId}</p>
        </div>
        {job.result === "pass" ? (
          <Badge className="bg-success text-success-foreground text-base px-4 py-1">Pass</Badge>
        ) : (
          <Badge variant="destructive" className="text-base px-4 py-1">Fail</Badge>
        )}
      </div>

      {/* Metadata */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Submitted By", value: job.submittedBy },
          { label: "Submitted", value: job.submitted },
          { label: "Processing Time", value: job.processingTime },
          { label: "Status", value: job.status },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-medium mt-1">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checks Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Preflight Checks</CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Download Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {job.checks.map((check) => (
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
    </div>
  );
}
