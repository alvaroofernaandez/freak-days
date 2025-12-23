import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useModulesStore } from "../../../stores/modules";
import type { ModuleId } from "../../../domain/types";

describe("useModulesStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("initialization", () => {
    it("should initialize with all modules disabled", () => {
      const store = useModulesStore();

      expect(store.modules).toHaveLength(6);
      store.modules.forEach((module) => {
        expect(module.enabled).toBe(false);
      });
    });

    it("should contain all expected module IDs", () => {
      const store = useModulesStore();
      const expectedIds: ModuleId[] = [
        "workouts",
        "manga",
        "anime",
        "quests",
        "party",
        "calendar",
      ];

      expectedIds.forEach((id) => {
        const module = store.modules.find((m) => m.id === id);
        expect(module).toBeDefined();
      });
    });
  });

  describe("toggleModule", () => {
    it("should enable a disabled module", () => {
      const store = useModulesStore();

      store.toggleModule("quests");

      const module = store.getModuleById("quests");
      expect(module?.enabled).toBe(true);
    });

    it("should disable an enabled module", () => {
      const store = useModulesStore();

      store.toggleModule("quests");
      store.toggleModule("quests");

      const module = store.getModuleById("quests");
      expect(module?.enabled).toBe(false);
    });

    it("should not affect other modules when toggling", () => {
      const store = useModulesStore();

      store.toggleModule("quests");

      const otherModules = store.modules.filter((m) => m.id !== "quests");
      otherModules.forEach((module) => {
        expect(module.enabled).toBe(false);
      });
    });
  });

  describe("enableModules", () => {
    it("should enable multiple modules at once", () => {
      const store = useModulesStore();

      store.enableModules(["quests", "anime", "manga"]);

      expect(store.getModuleById("quests")?.enabled).toBe(true);
      expect(store.getModuleById("anime")?.enabled).toBe(true);
      expect(store.getModuleById("manga")?.enabled).toBe(true);
      expect(store.getModuleById("workouts")?.enabled).toBe(false);
    });
  });

  describe("disableAllModules", () => {
    it("should disable all modules", () => {
      const store = useModulesStore();

      store.enableModules(["quests", "anime"]);
      store.disableAllModules();

      store.modules.forEach((module) => {
        expect(module.enabled).toBe(false);
      });
    });
  });

  describe("computed getters", () => {
    it("should return only enabled modules", () => {
      const store = useModulesStore();

      store.enableModules(["quests", "manga"]);

      expect(store.enabledModules).toHaveLength(2);
      expect(store.enabledModules.map((m) => m.id)).toContain("quests");
      expect(store.enabledModules.map((m) => m.id)).toContain("manga");
    });

    it("should correctly report if onboarding is complete", () => {
      const store = useModulesStore();

      expect(store.hasCompletedOnboarding).toBe(false);

      store.enableModules(["quests"]);

      expect(store.hasCompletedOnboarding).toBe(true);
    });
  });
});
