import { useAuthStore } from "~~/stores/auth";

export type AnimeStatus =
  | "watching"
  | "completed"
  | "on_hold"
  | "dropped"
  | "plan_to_watch"
  | "rewatching";

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
  cover_url?: string;
  notes?: string;
}

export function useAnime() {
  const authStore = useAuthStore();

  async function fetchAnimeList(): Promise<AnimeEntry[]> {
    if (!authStore.userId) return [];

    try {
      const data = await $fetch(`/api/anime?userId=${authStore.userId}`);
      return (data as any[]).map(mapDbToAnime);
    } catch (error) {
      console.error("Error fetching anime list:", error);
      return [];
    }
  }

  async function fetchByStatus(status: AnimeStatus): Promise<AnimeEntry[]> {
    if (!authStore.userId) return [];

    try {
      const data = await $fetch(
        `/api/anime?userId=${authStore.userId}&status=${status}`
      );
      return (data as any[]).map(mapDbToAnime);
    } catch (error) {
      console.error("Error fetching anime by status:", error);
      return [];
    }
  }

  async function addAnime(dto: CreateAnimeDTO): Promise<AnimeEntry | null> {
    if (!authStore.userId) {
      console.error("No user ID available");
      return null;
    }

    if (!dto.title || !dto.title.trim()) {
      console.error("Title is required");
      return null;
    }

    try {
      const data = await $fetch("/api/anime", {
        method: "POST",
        body: {
          userId: authStore.userId,
          ...dto,
        },
      });
      return mapDbToAnime(data as any);
    } catch (error) {
      console.error("Error in addAnime:", error);
      throw error;
    }
  }

  async function updateProgress(id: string, episode: number): Promise<boolean> {
    try {
      await $fetch(`/api/anime/${id}`, {
        method: "PATCH" as any,
        body: { currentEpisode: episode },
      });
      return true;
    } catch (error) {
      console.error("Error updating progress:", error);
      return false;
    }
  }

  async function updateStatus(
    id: string,
    status: AnimeStatus
  ): Promise<boolean> {
    try {
      const updates: {
        status: string;
        endDate?: Date;
        startDate?: Date;
      } = { status };

      if (status === "completed") {
        updates.endDate = new Date();
      } else if (status === "watching") {
        updates.startDate = new Date();
      }

      await $fetch(`/api/anime/${id}`, {
        method: "PATCH" as any,
        body: updates,
      });
      return true;
    } catch (error) {
      console.error("Error updating status:", error);
      return false;
    }
  }

  async function updateScore(id: string, score: number): Promise<boolean> {
    try {
      await $fetch(`/api/anime/${id}`, {
        method: "PATCH" as any,
        body: { score },
      });
      return true;
    } catch (error) {
      console.error("Error updating score:", error);
      return false;
    }
  }

  async function deleteAnime(id: string): Promise<boolean> {
    try {
      await $fetch(`/api/anime/${id}`, {
        method: "DELETE" as any,
      });
      return true;
    } catch (error) {
      console.error("Error deleting anime:", error);
      return false;
    }
  }

  function mapDbToAnime(row: {
    id: string;
    title: string;
    status: string;
    currentEpisode: number;
    totalEpisodes: number | null;
    score: number | null;
    notes: string | null;
    coverUrl: string | null;
    startDate: Date | null;
    endDate: Date | null;
    rewatchCount: number;
  }): AnimeEntry {
    return {
      id: row.id,
      title: row.title,
      status: row.status as AnimeStatus,
      currentEpisode: row.currentEpisode,
      totalEpisodes: row.totalEpisodes,
      score: row.score,
      notes: row.notes,
      coverUrl: row.coverUrl,
      startDate: row.startDate,
      endDate: row.endDate,
      rewatchCount: row.rewatchCount,
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
