import { useAuthStore } from "~~/stores/auth";

export type AnimeStatus =
  | "watching"
  | "completed"
  | "on_hold"
  | "dropped"
  | "plan_to_watch";

export interface AnimeEntry {
  id: string;
  title: string;
  status: AnimeStatus;
  currentEpisode: number;
  totalEpisodes: number | null;
  score: number | null;
  notes: string | null;
  coverUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  rewatchCount: number;
}

export interface CreateAnimeDTO {
  title: string;
  status: AnimeStatus;
  total_episodes?: number;
  score?: number;
}

export function useAnime() {
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function fetchAnimeList(): Promise<AnimeEntry[]> {
    if (!authStore.userId) return [];

    const { data, error } = await supabase
      .from("anime_list")
      .select("*")
      .eq("user_id", authStore.userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map(mapDbToAnime);
  }

  async function fetchByStatus(status: AnimeStatus): Promise<AnimeEntry[]> {
    if (!authStore.userId) return [];

    const { data, error } = await supabase
      .from("anime_list")
      .select("*")
      .eq("user_id", authStore.userId)
      .eq("status", status)
      .order("title");

    if (error) throw error;

    return (data ?? []).map(mapDbToAnime);
  }

  async function addAnime(dto: CreateAnimeDTO): Promise<AnimeEntry | null> {
    if (!authStore.userId) return null;

    const { data, error } = await supabase
      .from("anime_list")
      .insert({
        user_id: authStore.userId,
        title: dto.title,
        status: dto.status,
        total_episodes: dto.total_episodes,
        score: dto.score,
        current_episode: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return data ? mapDbToAnime(data) : null;
  }

  async function updateProgress(id: string, episode: number): Promise<boolean> {
    const { error } = await supabase
      .from("anime_list")
      .update({ current_episode: episode })
      .eq("id", id);

    return !error;
  }

  async function updateStatus(
    id: string,
    status: AnimeStatus
  ): Promise<boolean> {
    const updates: Record<string, unknown> = { status };

    if (status === "completed") {
      updates.end_date = new Date().toISOString().split("T")[0];
    } else if (status === "watching") {
      updates.start_date = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("anime_list")
      .update(updates)
      .eq("id", id);

    return !error;
  }

  async function updateScore(id: string, score: number): Promise<boolean> {
    const { error } = await supabase
      .from("anime_list")
      .update({ score })
      .eq("id", id);

    return !error;
  }

  async function deleteAnime(id: string): Promise<boolean> {
    const { error } = await supabase.from("anime_list").delete().eq("id", id);

    return !error;
  }

  function mapDbToAnime(row: Record<string, unknown>): AnimeEntry {
    return {
      id: row.id as string,
      title: row.title as string,
      status: row.status as AnimeStatus,
      currentEpisode: row.current_episode as number,
      totalEpisodes: row.total_episodes as number | null,
      score: row.score as number | null,
      notes: row.notes as string | null,
      coverUrl: row.cover_url as string | null,
      startDate: row.start_date ? new Date(row.start_date as string) : null,
      endDate: row.end_date ? new Date(row.end_date as string) : null,
      rewatchCount: row.rewatch_count as number,
    };
  }

  return {
    fetchAnimeList,
    fetchByStatus,
    addAnime,
    updateProgress,
    updateStatus,
    updateScore,
    deleteAnime,
  };
}
