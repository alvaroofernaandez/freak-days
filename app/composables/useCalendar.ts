import { useAuthStore } from "~~/stores/auth";

export type ReleaseType = "anime_episode" | "manga_volume" | "event";

export interface Release {
  id: string;
  title: string;
  type: ReleaseType;
  releaseDate: Date;
  notes: string | null;
}

export interface CreateReleaseDTO {
  title: string;
  type: ReleaseType;
  release_date: string;
  notes?: string;
}

export function useCalendar() {
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function fetchReleases(): Promise<Release[]> {
    if (!authStore.userId) return [];

    const { data, error } = await supabase
      .from("release_calendar")
      .select("*")
      .eq("user_id", authStore.userId)
      .order("release_date", { ascending: true });

    if (error) throw error;

    return (data ?? []).map(mapDbToRelease);
  }

  async function fetchUpcoming(daysAhead = 30): Promise<Release[]> {
    if (!authStore.userId) return [];

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from("release_calendar")
      .select("*")
      .eq("user_id", authStore.userId)
      .gte("release_date", today.toISOString().split("T")[0])
      .lte("release_date", futureDate.toISOString().split("T")[0])
      .order("release_date", { ascending: true });

    if (error) throw error;

    return (data ?? []).map(mapDbToRelease);
  }

  async function addRelease(dto: CreateReleaseDTO): Promise<Release | null> {
    if (!authStore.userId) return null;

    const { data, error } = await supabase
      .from("release_calendar")
      .insert({
        user_id: authStore.userId,
        title: dto.title,
        type: dto.type,
        release_date: dto.release_date,
        notes: dto.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return data ? mapDbToRelease(data) : null;
  }

  async function deleteRelease(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("release_calendar")
      .delete()
      .eq("id", id);

    return !error;
  }

  function mapDbToRelease(row: Record<string, unknown>): Release {
    return {
      id: row.id as string,
      title: row.title as string,
      type: row.type as ReleaseType,
      releaseDate: new Date(row.release_date as string),
      notes: row.notes as string | null,
    };
  }

  return {
    fetchReleases,
    fetchUpcoming,
    addRelease,
    deleteRelease,
  };
}
