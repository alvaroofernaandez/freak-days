import { useAuthStore } from "~~/stores/auth";

export type ReleaseType = "anime_episode" | "manga_volume" | "event";

export interface Release {
  id: string;
  title: string;
  type: ReleaseType;
  releaseDate: Date;
  description: string | null;
  url: string | null;
  createdAt: Date;
}

export interface CreateReleaseDTO {
  title: string;
  type: ReleaseType;
  release_date: string;
  description?: string;
  url?: string;
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
        release_type: dto.type,
        release_date: dto.release_date,
        description: dto.description,
        url: dto.url,
      })
      .select()
      .single();

    if (error) throw error;

    return data ? mapDbToRelease(data) : null;
  }

  async function updateRelease(
    id: string,
    dto: Partial<CreateReleaseDTO>
  ): Promise<Release | null> {
    if (!authStore.userId) return null;

    const updateData: Record<string, unknown> = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.type) updateData.release_type = dto.type;
    if (dto.release_date) updateData.release_date = dto.release_date;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.url !== undefined) updateData.url = dto.url;

    const { data, error } = await supabase
      .from("release_calendar")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", authStore.userId)
      .select()
      .single();

    if (error) throw error;

    return data ? mapDbToRelease(data) : null;
  }

  async function deleteRelease(id: string): Promise<boolean> {
    if (!authStore.userId) return false;

    const { error } = await supabase
      .from("release_calendar")
      .delete()
      .eq("id", id)
      .eq("user_id", authStore.userId);

    return !error;
  }

  function mapDbToRelease(row: Record<string, unknown>): Release {
    const dateStr = row.release_date as string;
    const date = new Date(dateStr + "T12:00:00");

    return {
      id: row.id as string,
      title: row.title as string,
      type: (row.release_type || row.type) as ReleaseType,
      releaseDate: date,
      description: (row.description || row.notes) as string | null,
      url: row.url as string | null,
      createdAt: new Date(row.created_at as string),
    };
  }

  return {
    fetchReleases,
    fetchUpcoming,
    addRelease,
    updateRelease,
    deleteRelease,
  };
}
