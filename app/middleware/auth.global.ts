import { useAuthStore } from "../../stores/auth";
import { useModulesStore } from "../../stores/modules";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const modulesStore = useModulesStore();
  const supabase = useSupabase();

  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(to.path);
  const isOnboardingRoute = to.path === "/onboarding";

  if (!authStore.session) {
    try {
      authStore.setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      authStore.setSession(session);
      authStore.setLoading(false);
    } catch {
      authStore.setLoading(false);
    }
  }

  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo("/login");
  }

  if (authStore.isAuthenticated && isPublicRoute) {
    if (!modulesStore.synced) {
      try {
        const { data } = await supabase
          .from("user_modules")
          .select("module_id, enabled")
          .eq("user_id", authStore.userId);

        if (data && data.length > 0) {
          modulesStore.setModulesFromDb(data);
        } else {
          modulesStore.synced = true;
        }
      } catch (error) {
        console.error("Error loading modules:", error);
        modulesStore.synced = true;
      }
    }

    if (!modulesStore.hasCompletedOnboarding) {
      return navigateTo("/onboarding");
    }
    return navigateTo("/");
  }

  if (authStore.isAuthenticated && !isOnboardingRoute && !modulesStore.synced) {
    try {
      const { data } = await supabase
        .from("user_modules")
        .select("module_id, enabled")
        .eq("user_id", authStore.userId);

      if (data && data.length > 0) {
        modulesStore.setModulesFromDb(data);
      } else {
        modulesStore.synced = true;
        return navigateTo("/onboarding");
      }
    } catch (error) {
      console.error("Error loading modules:", error);
      modulesStore.synced = true;
    }
  }
});
