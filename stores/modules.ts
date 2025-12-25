import { defineStore } from "pinia";
import type { AppModule, ModuleId } from "~~/domain/types/modules";
import { ALL_MODULES } from "~~/domain/types/modules";

interface ModuleState {
  modules: AppModule[];
  synced: boolean;
  moduleMap: Record<ModuleId, boolean>;
}

export const useModulesStore = defineStore("modules", {
  state: (): ModuleState => ({
    modules: ALL_MODULES.map((m) => ({ ...m, enabled: false })),
    synced: false,
    moduleMap: {} as Record<ModuleId, boolean>,
  }),

  getters: {
    isEnabled:
      (state) =>
      (moduleId: ModuleId): boolean => {
        return state.moduleMap[moduleId] ?? false;
      },

    enabledModules: (state): AppModule[] => {
      return state.modules.filter((m) => m.enabled);
    },

    hasCompletedOnboarding: (state): boolean => {
      return state.synced && state.modules.some((m) => m.enabled);
    },

    getModuleById:
      (state) =>
      (moduleId: ModuleId): AppModule | undefined => {
        return state.modules.find((m) => m.id === moduleId);
      },
  },

  actions: {
    setModule(moduleId: ModuleId, enabled: boolean) {
      this.moduleMap[moduleId] = enabled;
      const module = this.modules.find((m) => m.id === moduleId);
      if (module) {
        module.enabled = enabled;
      }
    },

    toggleModule(moduleId: ModuleId) {
      const current = this.moduleMap[moduleId] ?? false;
      this.setModule(moduleId, !current);
    },

    enableModules(moduleIds: ModuleId[]) {
      moduleIds.forEach((id) => {
        this.setModule(id, true);
      });
    },

    disableAllModules() {
      this.modules.forEach((module) => {
        this.setModule(module.id, false);
      });
    },

    setModulesFromDb(data: Array<{ module_id: ModuleId; enabled: boolean }>) {
      data.forEach(({ module_id, enabled }) => {
        this.setModule(module_id, enabled);
      });
      this.synced = true;
    },

    async syncToDatabase(supabase: any, userId: string) {
      const enabledModules = this.modules.filter((m) => m.enabled);

      for (const module of ALL_MODULES) {
        const isEnabled = this.moduleMap[module.id] ?? false;

        const { error: upsertError } = await supabase
          .from("user_modules")
          .upsert(
            {
              user_id: userId,
              module_id: module.id,
              enabled: isEnabled,
              enabled_at: isEnabled ? new Date().toISOString() : null,
            },
            {
              onConflict: "user_id,module_id",
            }
          );

        if (upsertError) {
          console.error(`Error syncing module ${module.id}:`, upsertError);
        }
      }
    },

    reset() {
      this.modules = ALL_MODULES.map((m) => ({ ...m, enabled: false }));
      this.moduleMap = {} as Record<ModuleId, boolean>;
      this.synced = false;
    },
  },
});
