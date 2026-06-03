import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDefaultPreset() {
  return useQuery({
    queryKey: ["default-preset"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("default_preset_id")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.default_preset_id ?? null;
    },
  });
}

export function useSetDefaultPreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (preset_id: string | null) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ default_preset_id: preset_id })
        .eq("id", user.id);
      if (error) throw error;
      return preset_id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["default-preset"] }),
  });
}
