import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

const mockJobs = Array.from({ length: 25 }, (_, i) => ({
  id: `job_${String(i + 1).padStart(3, "0")}`,
  filename: ["brochure_v3.pdf", "poster_final.pdf", "flyer_cmyk.pdf", "catalog_spread.pdf", "label_die.pdf"][i % 5],
  submitted: `2026-0${3 - Math.floor(i / 10)}-${String(28 - (i % 28)).padStart(2, "0")}`,
  status: i === 3 ? "processing" : i === 7 ? "failed" : "complete",
  result: i === 3 ? "-" : i % 4 === 0 ? "fail" : "pass",
  duration: i === 3 ? "-" : `${(Math.random() * 4 + 0.5).toFixed(1)}s`,
}));

function StatusBadge({ status, result }: { status: string; result: string }) {
  if (status === "processing") return <Badge variant="secondary">Processing</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (result === "pass") return <Badge className="bg-success text-success-foreground">Pass</Badge>;
  return <Badge variant="destructive">Fail</Badge>;
}

export default function JobHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const perPage = 10;

  const filtered = mockJobs.filter((job) => {
    const matchesSearch = job.filename.toLowerCase().includes(search.toLowerCase()) || job.id.includes(search);
    const matchesStatus = statusFilter === "all" || job.status === statusFilter || job.result === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

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
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                >
                  <TableCell className="font-mono text-sm">{job.id}</TableCell>
                  <TableCell className="font-medium">{job.filename}</TableCell>
                  <TableCell className="text-muted-foreground">{job.submitted}</TableCell>
                  <TableCell><StatusBadge status={job.status} result={job.result} /></TableCell>
                  <TableCell className="text-muted-foreground">{job.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
