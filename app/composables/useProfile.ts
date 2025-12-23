import { useAuthStore } from "~~/stores/auth";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalExp: number;
  level: number;
}

export function useProfile() {
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function fetchProfile(): Promise<UserProfile | null> {
    if (!authStore.userId) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authStore.userId)
      .single();

    if (error) return null;
    return data ? mapDbToProfile(data) : null;
  }

  async function updateProfile(updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  }): Promise<boolean> {
    if (!authStore.userId) return false;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", authStore.userId);

    return !error;
  }

  async function addExp(
    amount: number
  ): Promise<{ newTotal: number; newLevel: number } | null> {
    const profile = await fetchProfile();
    if (!profile) return null;

    const newTotal = profile.totalExp + amount;
    const newLevel = calculateLevel(newTotal);

    await supabase
      .from("profiles")
      .update({ total_exp: newTotal, level: newLevel })
      .eq("id", authStore.userId!);

    return { newTotal, newLevel };
  }

  function calculateLevel(exp: number): number {
    return Math.floor(exp / 100) + 1;
  }

  function expForNextLevel(currentExp: number): {
    current: number;
    needed: number;
    progress: number;
  } {
    const currentLevel = calculateLevel(currentExp);
    const expAtCurrentLevel = (currentLevel - 1) * 100;
    const expAtNextLevel = currentLevel * 100;
    const current = currentExp - expAtCurrentLevel;
    const needed = 100;
    const progress = (current / needed) * 100;

    return { current, needed, progress };
  }

  function mapDbToProfile(row: Record<string, unknown>): UserProfile {
    return {
      id: row.id as string,
      username: row.username as string,
      displayName: row.display_name as string | null,
      avatarUrl: row.avatar_url as string | null,
      totalExp: row.total_exp as number,
      level: row.level as number,
    };
  }

  return {
    fetchProfile,
    updateProfile,
    addExp,
    calculateLevel,
    expForNextLevel,
  };
}
