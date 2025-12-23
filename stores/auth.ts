import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User, Session } from "@supabase/supabase-js";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const userId = computed(() => user.value?.id);
  const userEmail = computed(() => user.value?.email);

  function setUser(newUser: User | null) {
    user.value = newUser;
  }

  function setSession(newSession: Session | null) {
    session.value = newSession;
    user.value = newSession?.user ?? null;
  }

  function setLoading(value: boolean) {
    loading.value = value;
  }

  function setError(message: string | null) {
    error.value = message;
  }

  function reset() {
    user.value = null;
    session.value = null;
    error.value = null;
  }

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    userId,
    userEmail,
    setUser,
    setSession,
    setLoading,
    setError,
    reset,
  };
});
