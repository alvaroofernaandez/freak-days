import { useAuthStore } from "~~/stores/auth";

export interface MangaEntry {
  id: string;
  title: string;
  author: string | null;
  totalVolumes: number | null;
  ownedVolumes: number[];
  status: "collecting" | "completed" | "dropped" | "wishlist";
  score: number | null;
  notes: string | null;
  coverUrl: string | null;
}

export interface CreateMangaDTO {
  title: string;
  author?: string;
  total_volumes?: number;
  status?: "collecting" | "completed" | "dropped" | "wishlist";
}

export function useManga() {
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function fetchCollection(): Promise<MangaEntry[]> {
    if (!authStore.userId) return [];

    const { data, error } = await supabase
      .from("manga_collection")
      .select("*")
      .eq("user_id", authStore.userId)
      .order("title");

    if (error) throw error;

    return (data ?? []).map(mapDbToManga);
  }

  async function addManga(dto: CreateMangaDTO): Promise<MangaEntry | null> {
    if (!authStore.userId) return null;

    const { data, error } = await supabase
      .from("manga_collection")
      .insert({
        user_id: authStore.userId,
        title: dto.title,
        author: dto.author,
        total_volumes: dto.total_volumes,
        status: dto.status ?? "collecting",
        owned_volumes: [],
      })
      .select()
      .single();

    if (error) throw error;

    return data ? mapDbToManga(data) : null;
  }

  async function addVolume(id: string, volume: number): Promise<boolean> {
    const manga = await getMangaById(id);
    if (!manga) return false;

    const volumes = [...manga.ownedVolumes];
    if (!volumes.includes(volume)) {
      volumes.push(volume);
      volumes.sort((a, b) => a - b);
    }

    const { error } = await supabase
      .from("manga_collection")
      .update({ owned_volumes: volumes })
      .eq("id", id);

    return !error;
  }

  async function removeVolume(id: string, volume: number): Promise<boolean> {
    const manga = await getMangaById(id);
    if (!manga) return false;

    const volumes = manga.ownedVolumes.filter((v) => v !== volume);

    const { error } = await supabase
      .from("manga_collection")
      .update({ owned_volumes: volumes })
      .eq("id", id);

    return !error;
  }

  async function updateScore(id: string, score: number): Promise<boolean> {
    const { error } = await supabase
      .from("manga_collection")
      .update({ score })
      .eq("id", id);

    return !error;
  }

  async function getMangaById(id: string): Promise<MangaEntry | null> {
    const { data, error } = await supabase
      .from("manga_collection")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data ? mapDbToManga(data) : null;
  }

  async function deleteManga(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("manga_collection")
      .delete()
      .eq("id", id);

    return !error;
  }

  function mapDbToManga(row: Record<string, unknown>): MangaEntry {
    return {
      id: row.id as string,
      title: row.title as string,
      author: row.author as string | null,
      totalVolumes: row.total_volumes as number | null,
      ownedVolumes: (row.owned_volumes as number[]) ?? [],
      status: row.status as MangaEntry["status"],
      score: row.score as number | null,
      notes: row.notes as string | null,
      coverUrl: row.cover_url as string | null,
    };
  }

  return {
    fetchCollection,
    addManga,
    addVolume,
    removeVolume,
    updateScore,
    getMangaById,
    deleteManga,
  };
}
