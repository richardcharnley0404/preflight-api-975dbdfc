import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, FileX, Clock, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboardStats, useRecentJobs, useDailyVolume } from "@/hooks/useApiData";

function StatusBadge({ status, result }: { status: string; result: string }) {
  if (status === "processing") return <Badge variant="secondary">Processing</Badge>;
  if (result === "pass") return <Badge className="bg-success text-success-foreground">Pass</Badge>;
  return <Badge variant="destructive">Fail</Badge>;
}

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentJobs, isLoading: jobsLoading } = useRecentJobs();
  const { data: dailyVolume, isLoading: volumeLoading } = useDailyVolume();

  const usagePercent = stats && stats.plan_limit > 0 ? (stats.jobs_this_month / stats.plan_limit) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your preflight overview for this month</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Jobs This Month</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.jobs_this_month}</div>
                <p className="text-xs text-muted-foreground">of {stats.plan_limit} limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
                <FileCheck className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pass_rate}%</div>
                <p className="text-xs text-muted-foreground">across all jobs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Processing</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_processing_time}</div>
                <p className="text-xs text-muted-foreground">per job</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Failed Jobs</CardTitle>
                <FileX className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failed_jobs}</div>
                <p className="text-xs text-muted-foreground">this month</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Usage Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-2 w-full" />
          ) : stats ? (
            <>
              <Progress value={usagePercent} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                {stats.jobs_this_month} / {stats.plan_limit} jobs used ({usagePercent.toFixed(0)}%)
              </p>
            </>
          ) : null}
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
              {volumeLoading ? (
                <Skeleton className="h-full w-full" />
              ) : dailyVolume ? (
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
                    <Line type="monotone" dataKey="jobs" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentJobs && Array.isArray(recentJobs) && recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{job.filename}</p>
                      <p className="text-xs text-muted-foreground">{job.submitted}</p>
                    </div>
                    <StatusBadge status={job.status} result={job.result} />
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
