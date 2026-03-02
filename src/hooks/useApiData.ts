import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete, apiUpload } from "@/lib/api";

// ─── Dashboard ───
export interface DashboardStats {
  jobs_this_month: number;
  plan_limit: number;
  pass_rate: number;
  avg_processing_time: string;
  failed_jobs: number;
}

export interface RecentJob {
  id: string;
  filename: string;
  status: string;
  result: string;
  submitted: string;
}

export interface DailyVolume {
  day: string;
  jobs: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiGet<DashboardStats>("/api/dashboard/stats"),
  });
}

export function useRecentJobs() {
  return useQuery({
    queryKey: ["dashboard", "recent-jobs"],
    queryFn: () => apiGet<RecentJob[]>("/api/dashboard/recent-jobs"),
  });
}

export function useDailyVolume() {
  return useQuery({
    queryKey: ["dashboard", "daily-volume"],
    queryFn: () => apiGet<DailyVolume[]>("/api/dashboard/daily-volume"),
  });
}

// ─── Job History ───
export interface Job {
  id: string;
  filename: string;
  submitted: string;
  status: string;
  result: string;
  duration: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
}

export function useJobHistory(params: {
  search?: string;
  status?: string;
  page: number;
  per_page: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  searchParams.set("page", String(params.page));
  searchParams.set("per_page", String(params.per_page));

  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => apiGet<JobListResponse>(`/api/jobs?${searchParams.toString()}`),
  });
}

// ─── Job Detail ───
export interface JobCheck {
  name: string;
  status: string;
  details: string;
}

export interface JobDetail {
  id: string;
  filename: string;
  submitted_by: string;
  submitted: string;
  processing_time: string;
  status: string;
  result: string;
  checks: JobCheck[];
}

export function useJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => apiGet<JobDetail>(`/api/jobs/${jobId}`),
    enabled: !!jobId,
  });
}

// ─── Submit Job ───
export interface SubmitJobResponse {
  id: string;
  filename: string;
  status: string;
}

export function useSubmitJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => apiUpload<SubmitJobResponse>("/api/jobs", file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── API Keys ───
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  last_used: string;
  active: boolean;
}

export interface CreateKeyResponse {
  id: string;
  name: string;
  key: string;
  created: string;
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiGet<ApiKey[]>("/api/keys"),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiPost<CreateKeyResponse>("/api/keys", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

// ─── Billing ───
export interface BillingInfo {
  current_plan: {
    name: string;
    jobs_used: number;
    jobs_limit: number;
    keys_used: number;
    keys_limit: number;
  };
  plans: {
    name: string;
    price: string;
    jobs: string;
    keys: string;
    current: boolean;
  }[];
  invoices: {
    id: string;
    date: string;
    amount: string;
    status: string;
  }[];
}

export function useBillingInfo() {
  return useQuery({
    queryKey: ["billing"],
    queryFn: () => apiGet<BillingInfo>("/api/billing"),
  });
}
