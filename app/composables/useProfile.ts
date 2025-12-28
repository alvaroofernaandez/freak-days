import { useAuthStore } from "~~/stores/auth";
import { useSupabase } from "./useSupabase";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
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

    try {
      const data = await $fetch(`/api/profile/${authStore.userId}`);
      return mapDbToProfile(data as any);
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }

  async function updateProfile(updates: {
    username?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
    bio?: string | null;
    favorite_anime_id?: string | null;
    favorite_manga_id?: string | null;
    location?: string | null;
    website?: string | null;
    social_links?: Record<string, string>;
  }): Promise<boolean> {
    if (!authStore.userId) return false;

    try {
      await $fetch(`/api/profile/${authStore.userId}`, {
        method: "PUT" as any,
        body: updates,
      });
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    if (!authStore.userId) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${authStore.userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        return null;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      if (data?.publicUrl) {
        await updateProfile({ avatar_url: data.publicUrl });
        return data.publicUrl;
      }

      return null;
    } catch (error) {
      console.error("Error in uploadAvatar:", error);
      return null;
    }
  }

  async function deleteAvatar(): Promise<boolean> {
    if (!authStore.userId) return false;

    try {
      const currentProfile = await fetchProfile();
      if (!currentProfile?.avatarUrl) return false;

      const avatarUrl = currentProfile.avatarUrl;
      const urlParts = avatarUrl.split("/avatars/");
      if (urlParts.length < 2) {
        await updateProfile({ avatar_url: null });
        return true;
      }

      const filePath = urlParts[1];
      if (filePath && filePath.startsWith(authStore.userId)) {
        const { error } = await supabase.storage
          .from("avatars")
          .remove([filePath]);

        if (error) {
          console.error("Error deleting avatar:", error);
        }
      }

      await updateProfile({ avatar_url: null });
      return true;
    } catch (error) {
      console.error("Error in deleteAvatar:", error);
      return false;
    }
  }

  async function uploadBanner(file: File): Promise<string | null> {
    if (!authStore.userId) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      const filePath = `${authStore.userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading banner:", uploadError);
        return null;
      }

      const { data } = supabase.storage.from("banners").getPublicUrl(filePath);

      if (data?.publicUrl) {
        await updateProfile({ banner_url: data.publicUrl });
        return data.publicUrl;
      }

      return null;
    } catch (error) {
      console.error("Error in uploadBanner:", error);
      return null;
    }
  }

  async function deleteBanner(): Promise<boolean> {
    if (!authStore.userId) return false;

    try {
      const currentProfile = await fetchProfile();
      if (!currentProfile?.bannerUrl) return false;

      const bannerUrl = currentProfile.bannerUrl;
      const urlParts = bannerUrl.split("/banners/");
      if (urlParts.length < 2) {
        await updateProfile({ banner_url: null });
        return true;
      }

      const filePath = urlParts[1];
      if (filePath && filePath.startsWith(authStore.userId)) {
        const { error } = await supabase.storage
          .from("banners")
          .remove([filePath]);

        if (error) {
          console.error("Error deleting banner:", error);
        }
      }

      await updateProfile({ banner_url: null });
      return true;
    } catch (error) {
      console.error("Error in deleteBanner:", error);
      return false;
    }
  }

  async function addExp(
    amount: number
  ): Promise<{ newTotal: number; newLevel: number } | null> {
    if (!authStore.userId) return null;

    try {
      const result = await $fetch(`/api/profile/${authStore.userId}/exp`, {
        method: "POST",
        body: { amount },
      });
      return result as { newTotal: number; newLevel: number };
    } catch (error) {
      console.error("Error adding exp:", error);
      return null;
    }
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

  function mapDbToProfile(row: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    totalExp: number;
    level: number;
    bio: string | null;
    favoriteAnimeId: string | null;
    favoriteMangaId: string | null;
    location: string | null;
    website: string | null;
    socialLinks: any;
  }): UserProfile {
    return {
      id: row.id,
      username: row.username ?? "",
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      bannerUrl: row.bannerUrl,
      totalExp: row.totalExp,
      level: row.level,
      bio: row.bio,
      favoriteAnimeId: row.favoriteAnimeId,
      favoriteMangaId: row.favoriteMangaId,
      location: row.location,
      website: row.website,
      socialLinks: (row.socialLinks as Record<string, string>) ?? {},
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
    uploadBanner,
    deleteBanner,
  };
}
