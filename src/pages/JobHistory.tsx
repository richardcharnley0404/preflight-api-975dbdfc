import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

function StatusBadge({ status, passed }: { status: string; passed: boolean | null }) {
  if (status === "pending" || status === "queued" || status === "processing")
    return <Badge variant="secondary">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (passed === true) return <Badge className="bg-success text-success-foreground">Pass</Badge>;
  if (passed === false) return <Badge variant="destructive">Fail</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function JobHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const perPage = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", { search, statusFilter, page }],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*", { count: "exact" })
        .order("submitted_at", { ascending: false })
        .range(page * perPage, (page + 1) * perPage - 1);

      if (search) {
        query = query.or(`filename.ilike.%${search}%,job_id.ilike.%${search}%`);
      }
      if (statusFilter === "pass") {
        query = query.eq("passed", true);
      } else if (statusFilter === "fail") {
        query = query.eq("passed", false);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: jobs, count, error } = await query;
      if (error) throw error;
      return { jobs: jobs ?? [], total: count ?? 0 };
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("jobs-history")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => queryClient.invalidateQueries({ queryKey: ["jobs"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);


  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job History</h1>
        <p className="text-muted-foreground">View all your preflight jobs</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by filename or job ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                    >
                      <TableCell className="font-mono text-sm">{job.job_id || job.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{job.filename}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(job.submitted_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell><StatusBadge status={job.status} passed={job.passed} /></TableCell>
                    </TableRow>
                  ))}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
