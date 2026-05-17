import { supabase } from "@/integrations/supabase/client";

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/preflight-proxy`;

function proxyUrl(path: string): string {
  return `${PROXY_BASE}?path=${encodeURIComponent(path)}`;
}

async function throwIfError(res: Response): Promise<void> {
  if (res.ok) return;
  let detail: string | undefined;
  try {
    const body = await res.clone().json();
    if (typeof body?.detail === "string") {
      detail = body.detail;
    } else if (Array.isArray(body?.detail)) {
      detail = body.detail
        .map((e: { msg?: string; loc?: (string | number)[] }) => {
          const where = Array.isArray(e.loc) ? e.loc.join(".") : "";
          return where ? `${where}: ${e.msg}` : e.msg;
        })
        .filter(Boolean)
        .join("; ");
    } else if (typeof body === "string") {
      detail = body;
    }
  } catch {
    // Body wasn't JSON; fall through
  }
  throw new Error(detail || `API error: ${res.status} ${res.statusText}`);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(proxyUrl(path), { headers });
  await throwIfError(res);
  return res.json();
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(proxyUrl(path), {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  await throwIfError(res);
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(proxyUrl(path), {
    method: "DELETE",
    headers,
  });
  await throwIfError(res);
  return res.json();
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(proxyUrl(path), {
    method: "POST",
    headers,
    body: formData,
  });
  await throwIfError(res);
  return res.json();
}
