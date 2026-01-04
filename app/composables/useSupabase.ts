import type { SupabaseClient } from "@supabase/supabase-js";

export function useSupabase(): SupabaseClient {
  return useSupabaseClient();
}
