import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function useSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const config = useRuntimeConfig();
  const url = config.public.supabaseUrl as string;
  const key = config.public.supabaseAnonKey as string;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or Anon Key");
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}
