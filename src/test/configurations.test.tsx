import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  apiUpload: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }, from: vi.fn() },
}));

import * as api from "@/lib/api";
import {
  useCustomPresets,
  useCreateCustomPreset,
  useUpdateCustomPreset,
  useDeleteCustomPreset,
} from "@/hooks/useApiData";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("custom preset CRUD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists presets via GET /api/dashboard/presets/custom/list", async () => {
    (api.apiGet as ReturnType<typeof vi.fn>).mockResolvedValue({
      presets: [{ id: "x", preset_id: "x", name: "X", spec: {}, for_product_types: [] }],
    });
    const { result } = renderHook(() => useCustomPresets(), { wrapper });
    const refetched = await result.current.refetch();
    expect(api.apiGet).toHaveBeenCalledWith("/api/dashboard/presets/custom/list");
    expect(refetched.data?.presets).toHaveLength(1);
  });



  it("creates via POST", async () => {
    (api.apiPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useCreateCustomPreset(), { wrapper });
    await result.current.mutateAsync({
      preset_id: "p1", name: "P1", spec: {}, for_product_types: ["single_page"],
    });
    expect(api.apiPost).toHaveBeenCalledWith(
      "/api/dashboard/presets/custom",
      expect.objectContaining({ preset_id: "p1" }),
    );
  });

  it("updates via PUT to preset_id path", async () => {
    (api.apiPut as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useUpdateCustomPreset(), { wrapper });
    await result.current.mutateAsync({ preset_id: "p1", name: "renamed" });
    expect(api.apiPut).toHaveBeenCalledWith(
      "/api/dashboard/presets/custom/p1",
      expect.objectContaining({ name: "renamed" }),
    );
  });

  it("deletes via DELETE to preset_id path", async () => {
    (api.apiDelete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteCustomPreset(), { wrapper });
    await result.current.mutateAsync("p1");
    expect(api.apiDelete).toHaveBeenCalledWith("/api/dashboard/presets/custom/p1");
  });
});
