import { useAuthStore } from "../../stores/auth";

export function useAuth() {
  const supabase = useSupabase();
  const authStore = useAuthStore();
  const router = useRouter();

  async function initialize() {
    authStore.setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      authStore.setSession(session);

      if (session?.user) {
        await ensureProfileExists(session.user.id, session.user.email ?? "");
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        authStore.setSession(session);

        if (event === "SIGNED_IN" && session?.user) {
          await ensureProfileExists(session.user.id, session.user.email ?? "");

          const { data: userModules } = await supabase
            .from("user_modules")
            .select("module_id")
            .eq("user_id", session.user.id);

          if (!userModules || userModules.length === 0) {
            router.push("/onboarding");
          } else {
            router.push("/");
          }
        }
      });
    } catch (err) {
      authStore.setError("Error initializing auth");
    } finally {
      authStore.setLoading(false);
    }
  }

  async function ensureProfileExists(userId: string, email: string) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existingProfile) {
      await createProfile(userId, email);
    }
  }

  async function signUp(email: string, password: string) {
    authStore.setLoading(true);
    authStore.setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await createProfile(data.user.id, email);
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error signing up";
      authStore.setError(message);
      return { success: false, error: message };
    } finally {
      authStore.setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    authStore.setLoading(true);
    authStore.setError(null);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (authData.user) {
        await ensureProfileExists(authData.user.id, email);

        const { data: userModules } = await supabase
          .from("user_modules")
          .select("module_id")
          .eq("user_id", authData.user.id);

        if (!userModules || userModules.length === 0) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error signing in";
      authStore.setError(message);
      return { success: false, error: message };
    } finally {
      authStore.setLoading(false);
    }
  }

  async function signOut() {
    authStore.setLoading(true);
    try {
      await supabase.auth.signOut();
      authStore.reset();
      router.push("/login");
    } catch (err) {
      authStore.setError("Error signing out");
    } finally {
      authStore.setLoading(false);
    }
  }

  async function createProfile(userId: string, email: string) {
    const username = email.split("@")[0] || `user_${userId.slice(0, 8)}`;

    const { error } = await supabase.from("profiles").insert({
      id: userId,
      username,
      display_name: username,
      total_exp: 0,
      level: 1,
    });

    if (error && error.code !== "23505") {
      console.error("Error creating profile:", error);
    }
  }

  async function signInWithGoogle() {
    authStore.setLoading(true);
    authStore.setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error signing in with Google";
      authStore.setError(message);
    } finally {
      authStore.setLoading(false);
    }
  }

  return {
    initialize,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    ensureProfileExists,
  };
}
