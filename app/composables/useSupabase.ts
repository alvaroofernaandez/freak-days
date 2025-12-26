import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function useSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const config = useRuntimeConfig();
  const url =
    (config.public.supabaseUrl as string) ||
    (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
  const key =
    (config.public.supabaseAnonKey as string) ||
    (typeof process !== "undefined"
      ? process.env.SUPABASE_ANON_KEY
      : undefined);

  if (!url || !key) {
    throw new Error("Missing Supabase URL or Anon Key");
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}
