import { useAuthStore } from "~~/stores/auth";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalExp: number;
  level: number;
  bio: string | null;
  favoriteAnimeId: string | null;
  favoriteMangaId: string | null;
  location: string | null;
  website: string | null;
  socialLinks: Record<string, string>;
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
    bio?: string;
    favorite_anime_id?: string | null;
    favorite_manga_id?: string | null;
    location?: string | null;
    website?: string | null;
    social_links?: Record<string, string>;
  }): Promise<boolean> {
    if (!authStore.userId) return false;

    const { error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authStore.userId);

    return !error;
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    if (!authStore.userId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${authStore.userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        await updateProfile({ avatar_url: data.publicUrl });
        return data.publicUrl;
      }

      return null;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return null;
    }
  }

  async function deleteAvatar(): Promise<boolean> {
    if (!authStore.userId) return false;

    try {
      const currentProfile = await fetchProfile();
      if (!currentProfile?.avatarUrl) return false;

      const avatarUrl = currentProfile.avatarUrl;
      const urlParts = avatarUrl.split('/avatars/');
      if (urlParts.length < 2) {
        await updateProfile({ avatar_url: null });
        return true;
      }

      const filePath = urlParts[1];
      if (filePath && filePath.startsWith(authStore.userId)) {
        const { error } = await supabase.storage
          .from('avatars')
          .remove([filePath]);

        if (error) {
          console.error('Error deleting avatar:', error);
        }
      }

      await updateProfile({ avatar_url: null });
      return true;
    } catch (error) {
      console.error('Error in deleteAvatar:', error);
      return false;
    }
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
      bio: row.bio as string | null ?? null,
      favoriteAnimeId: row.favorite_anime_id as string | null ?? null,
      favoriteMangaId: row.favorite_manga_id as string | null ?? null,
      location: row.location as string | null ?? null,
      website: row.website as string | null ?? null,
      socialLinks: (row.social_links as Record<string, string>) ?? {},
    };
  }

  return {
    fetchProfile,
    updateProfile,
    addExp,
    calculateLevel,
    expForNextLevel,
    uploadAvatar,
    deleteAvatar,
  };
}
