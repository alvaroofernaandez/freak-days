import { ref } from "vue";
import type { PartySharedList, SharedListType } from "~~/domain/types/party";
import { useAuthStore } from "~~/stores/auth";
import { useSupabase } from "./useSupabase";

export function usePartyLists(partyId: string) {
  const lists = ref<PartySharedList[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function getAuthToken(): Promise<string | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  async function fetchLists(overridePartyId?: string) {
    loading.value = true;
    error.value = null;
    try {
      const idToUse = overridePartyId || partyId;
      if (!idToUse) {
        throw new Error("Party ID is required");
      }

      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const data = await $fetch<PartySharedList[]>(
        `/api/party/${idToUse}/lists`,
        {
          credentials: "include",
          headers,
        }
      );
      lists.value = data;
    } catch (e: any) {
      error.value = e.message || e.data?.message || "Error fetching lists";
      console.error("Error fetching party lists:", e);
    } finally {
      loading.value = false;
    }
  }

  async function createList(name: string, type: SharedListType) {
    loading.value = true;
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const newList = await $fetch<PartySharedList>(
        `/api/party/${partyId}/lists`,
        {
          method: "POST",
          body: { name, listType: type },
          credentials: "include",
          headers,
        }
      );
      lists.value.unshift(newList);
      return newList;
    } catch (e: any) {
      error.value = e.message || e.data?.message || "Error creating list";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    lists,
    loading,
    error,
    fetchLists,
    createList,
  };
}
