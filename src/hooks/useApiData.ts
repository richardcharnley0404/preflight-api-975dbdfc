import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete, apiUpload } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

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
export interface PageSpec {
  type: "combined" | "front" | "back";
  range: string;
  trim: { width: number; height: number };
  bleed: { left: number; right: number; top: number; bottom: number };
  safe_zone: { left: number; right: number; top: number; bottom: number };
}

export interface SubmitJobPayload {
  job_id?: string;
  artwork: { url: string; filename: string };
  webhook?: { url: string; secret: string };
  proof?: { generate: boolean; expires_hours: number };
  spec: {
    units: "mm" | "in";
    pages: PageSpec[];
    page_count: { min: number; max: number; must_be_even: boolean };
    min_dpi: number;
    colour_space: "any" | "CMYK" | "RGB";
    font_check: boolean;
    dimension_tolerance_mm: number;
  };
}

export interface SubmitJobResponse {
  job_id: string;
  status: string;
  created_at?: string;
}

export function useSubmitJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitJobPayload) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json() as Promise<SubmitJobResponse>;
    },
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
  prefix: string;
  created_at: string;
  last_used_at?: string;
  active: boolean;
}

export interface CreateKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  created_at: string;
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
