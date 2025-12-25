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
  pricePerVolume: number | null;
  totalCost: number | null;
}

export interface CreateMangaDTO {
  title: string;
  author?: string;
  total_volumes?: number;
  status?: "collecting" | "completed" | "dropped" | "wishlist";
  price_per_volume?: number;
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
        price_per_volume: dto.price_per_volume,
        total_cost: 0,
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

    const totalCost = manga.pricePerVolume 
      ? Math.round(volumes.length * manga.pricePerVolume * 100) / 100
      : manga.totalCost ?? 0;

    const updateData: Record<string, unknown> = { 
      owned_volumes: volumes,
      total_cost: totalCost,
    };

    if (manga.status === 'wishlist' && volumes.length > 0) {
      updateData.status = 'collecting';
    }

    if (manga.totalVolumes && volumes.length === manga.totalVolumes) {
      updateData.status = 'completed';
    }

    const { error } = await supabase
      .from("manga_collection")
      .update(updateData)
      .eq("id", id);

    return !error;
  }

  async function removeVolume(id: string, volume: number): Promise<boolean> {
    const manga = await getMangaById(id);
    if (!manga) return false;

    const volumes = manga.ownedVolumes.filter((v) => v !== volume);

    const totalCost = manga.pricePerVolume 
      ? Math.round(volumes.length * manga.pricePerVolume * 100) / 100
      : 0;

    const updateData: Record<string, unknown> = { 
      owned_volumes: volumes,
      total_cost: totalCost,
    };

    if (manga.status === 'completed' && volumes.length < (manga.totalVolumes ?? Infinity)) {
      updateData.status = 'collecting';
    }

    const { error } = await supabase
      .from("manga_collection")
      .update(updateData)
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

  async function updatePricePerVolume(id: string, price: number | null): Promise<boolean> {
    const manga = await getMangaById(id);
    if (!manga) return false;

    const totalCost = price && manga.ownedVolumes.length > 0
      ? Math.round(manga.ownedVolumes.length * price * 100) / 100
      : 0;

    const { error } = await supabase
      .from("manga_collection")
      .update({ 
        price_per_volume: price,
        total_cost: totalCost,
      })
      .eq("id", id);

    return !error;
  }

  async function updateStatus(id: string, status: MangaEntry["status"]): Promise<boolean> {
    const manga = await getMangaById(id);
    if (!manga) return false;

    const updateData: Record<string, unknown> = { status };

    if (status === 'completed' && manga.totalVolumes) {
      const allVolumes = Array.from({ length: manga.totalVolumes }, (_, i) => i + 1);
      const totalCost = manga.pricePerVolume 
        ? Math.round(manga.totalVolumes * manga.pricePerVolume * 100) / 100
        : manga.totalCost ?? 0;

      updateData.owned_volumes = allVolumes;
      updateData.total_cost = totalCost;
    }

    const { error } = await supabase
      .from("manga_collection")
      .update(updateData)
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
    const pricePerVolume = row.price_per_volume
    const totalCost = row.total_cost
    
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
      pricePerVolume: pricePerVolume != null ? parseFloat(String(pricePerVolume)) : null,
      totalCost: totalCost != null ? parseFloat(String(totalCost)) : null,
    };
  }

  return {
    fetchCollection,
    addManga,
    addVolume,
    removeVolume,
    updateScore,
    updatePricePerVolume,
    updateStatus,
    getMangaById,
    deleteManga,
  };
}
