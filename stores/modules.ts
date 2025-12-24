import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModuleId, AppModule } from "../domain/types";
import { ALL_MODULES } from "../domain/types";

export const useModulesStore = defineStore("modules", () => {
  const modules = ref<AppModule[]>(ALL_MODULES.map((m) => ({ ...m })));
  const synced = ref(false);

  const enabledModules = computed(() => modules.value.filter((m) => m.enabled));

  const hasCompletedOnboarding = computed(() =>
    modules.value.some((m) => m.enabled)
  );

  function getModuleById(id: ModuleId) {
    return modules.value.find((m) => m.id === id);
  }

  function toggleModule(id: ModuleId) {
    const module = getModuleById(id);
    if (module) {
      module.enabled = !module.enabled;
    }
  }

  function enableModules(ids: ModuleId[]) {
    ids.forEach((id) => {
      const module = getModuleById(id);
      if (module) {
        module.enabled = true;
      }
    });
  }

  function disableAllModules() {
    modules.value.forEach((m) => {
      m.enabled = false;
    });
  }

  function setModulesFromDb(
    dbModules: { module_id: string; enabled: boolean }[]
  ) {
    dbModules.forEach((dbModule) => {
      const module = modules.value.find((m) => m.id === dbModule.module_id);
      if (module) {
        module.enabled = dbModule.enabled;
      }
    });
    synced.value = true;
  }

  async function syncToDatabase(supabase: SupabaseClient, userId: string) {
    const enabledIds = enabledModules.value.map((m) => m.id);

    await supabase.from("user_modules").delete().eq("user_id", userId);

    if (enabledIds.length > 0) {
      const rows = enabledIds.map((moduleId) => ({
        user_id: userId,
        module_id: moduleId,
        enabled: true,
      }));

      await supabase.from("user_modules").insert(rows);
    }
  }

  return {
    modules,
    synced,
    enabledModules,
    hasCompletedOnboarding,
    getModuleById,
    toggleModule,
    enableModules,
    disableAllModules,
    setModulesFromDb,
    syncToDatabase,
  };
});
