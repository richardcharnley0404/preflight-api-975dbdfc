import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileCheck, FileX, Clock, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data — will be replaced with Railway API calls
const kpis = {
  jobsThisMonth: 32,
  planLimit: 50,
  passRate: 87.5,
  avgProcessingTime: "2.4s",
};

const recentJobs = [
  { id: "job_001", filename: "brochure_v3.pdf", status: "complete", result: "pass", date: "2026-03-01" },
  { id: "job_002", filename: "poster_final.pdf", status: "complete", result: "fail", date: "2026-03-01" },
  { id: "job_003", filename: "flyer_cmyk.pdf", status: "complete", result: "pass", date: "2026-02-28" },
  { id: "job_004", filename: "catalog_spread.pdf", status: "processing", result: "-", date: "2026-02-28" },
  { id: "job_005", filename: "label_die.pdf", status: "complete", result: "pass", date: "2026-02-27" },
];

const dailyVolume = Array.from({ length: 28 }, (_, i) => ({
  day: `${i + 1}`,
  jobs: Math.floor(Math.random() * 5) + 1,
}));

function StatusBadge({ status, result }: { status: string; result: string }) {
  if (status === "processing") return <Badge variant="secondary">Processing</Badge>;
  if (result === "pass") return <Badge className="bg-success text-success-foreground">Pass</Badge>;
  return <Badge variant="destructive">Fail</Badge>;
}

export default function Dashboard() {
  const usagePercent = (kpis.jobsThisMonth / kpis.planLimit) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your preflight overview for this month</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jobs This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.jobsThisMonth}</div>
            <p className="text-xs text-muted-foreground">of {kpis.planLimit} limit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
            <FileCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.passRate}%</div>
            <p className="text-xs text-muted-foreground">across all jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgProcessingTime}</div>
            <p className="text-xs text-muted-foreground">per job</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Jobs</CardTitle>
            <FileX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={usagePercent} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            {kpis.jobsThisMonth} / {kpis.planLimit} jobs used ({usagePercent.toFixed(0)}%)
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Job Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="jobs"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{job.filename}</p>
                    <p className="text-xs text-muted-foreground">{job.date}</p>
                  </div>
                  <StatusBadge status={job.status} result={job.result} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
