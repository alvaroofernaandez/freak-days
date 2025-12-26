import { describe, it, expect, beforeEach, vi } from "vitest";
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

  describe("setModule", () => {
    it("should enable a module", () => {
      const store = useModulesStore();

      store.setModule("quests", true);

      expect(store.isEnabled("quests")).toBe(true);
      expect(store.getModuleById("quests")?.enabled).toBe(true);
    });

    it("should disable a module", () => {
      const store = useModulesStore();

      store.setModule("quests", true);
      store.setModule("quests", false);

      expect(store.isEnabled("quests")).toBe(false);
      expect(store.getModuleById("quests")?.enabled).toBe(false);
    });

    it("should update moduleMap when setting module", () => {
      const store = useModulesStore();

      store.setModule("anime", true);

      expect(store.moduleMap.anime).toBe(true);
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
      store.synced = true;

      expect(store.hasCompletedOnboarding).toBe(true);
    });

    it("should return false for hasCompletedOnboarding when not synced", () => {
      const store = useModulesStore();

      store.enableModules(["quests"]);
      store.synced = false;

      expect(store.hasCompletedOnboarding).toBe(false);
    });

    it("should return false for hasCompletedOnboarding when no modules enabled", () => {
      const store = useModulesStore();

      store.synced = true;

      expect(store.hasCompletedOnboarding).toBe(false);
    });

    it("isEnabled should return false for disabled module", () => {
      const store = useModulesStore();

      expect(store.isEnabled("quests")).toBe(false);
    });

    it("isEnabled should return true for enabled module", () => {
      const store = useModulesStore();

      store.setModule("quests", true);

      expect(store.isEnabled("quests")).toBe(true);
    });

    it("isEnabled should return false for unknown module", () => {
      const store = useModulesStore();

      expect(store.isEnabled("unknown" as ModuleId)).toBe(false);
    });

    it("getModuleById should return module when found", () => {
      const store = useModulesStore();

      const module = store.getModuleById("quests");

      expect(module).toBeDefined();
      expect(module?.id).toBe("quests");
    });

    it("getModuleById should return undefined for unknown module", () => {
      const store = useModulesStore();

      const module = store.getModuleById("unknown" as ModuleId);

      expect(module).toBeUndefined();
    });
  });

  describe("setModulesFromDb", () => {
    it("should set modules from database data", () => {
      const store = useModulesStore();

      store.setModulesFromDb([
        { module_id: "quests", enabled: true },
        { module_id: "anime", enabled: true },
        { module_id: "manga", enabled: false },
      ]);

      expect(store.isEnabled("quests")).toBe(true);
      expect(store.isEnabled("anime")).toBe(true);
      expect(store.isEnabled("manga")).toBe(false);
      expect(store.synced).toBe(true);
    });

    it("should mark as synced after setting modules", () => {
      const store = useModulesStore();

      expect(store.synced).toBe(false);

      store.setModulesFromDb([{ module_id: "quests", enabled: true }]);

      expect(store.synced).toBe(true);
    });
  });

  describe("syncToDatabase", () => {
    it("should sync all modules to database", async () => {
      const store = useModulesStore();
      const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
      };

      store.setModule("quests", true);
      store.setModule("anime", false);

      await store.syncToDatabase(mockSupabase, "user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("user_modules");
      expect(mockSupabase.upsert).toHaveBeenCalledTimes(6);
    });

    it("should handle upsert errors gracefully", async () => {
      const store = useModulesStore();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        upsert: vi.fn(() =>
          Promise.resolve({ error: { message: "Database error" } })
        ),
      };

      await store.syncToDatabase(mockSupabase, "user-123");

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should include enabled_at when module is enabled", async () => {
      const store = useModulesStore();
      const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
      };

      store.setModule("quests", true);

      await store.syncToDatabase(mockSupabase, "user-123");

      const upsertCalls = mockSupabase.upsert.mock.calls;
      const questsCall = upsertCalls.find(
        (call) => call[0]?.module_id === "quests"
      );

      expect(questsCall[0].enabled_at).toBeTruthy();
      expect(questsCall[0].enabled).toBe(true);
    });

    it("should set enabled_at to null when module is disabled", async () => {
      const store = useModulesStore();
      const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
      };

      store.setModule("quests", false);

      await store.syncToDatabase(mockSupabase, "user-123");

      const upsertCalls = mockSupabase.upsert.mock.calls;
      const questsCall = upsertCalls.find(
        (call) => call[0]?.module_id === "quests"
      );

      expect(questsCall[0].enabled_at).toBeNull();
      expect(questsCall[0].enabled).toBe(false);
    });
  });

  describe("reset", () => {
    it("should reset all modules to disabled state", () => {
      const store = useModulesStore();

      store.enableModules(["quests", "anime", "manga"]);
      store.synced = true;
      store.reset();

      expect(store.modules.every((m) => !m.enabled)).toBe(true);
      expect(store.moduleMap).toEqual({});
      expect(store.synced).toBe(false);
    });

    it("should reset moduleMap to empty object", () => {
      const store = useModulesStore();

      store.setModule("quests", true);
      store.reset();

      expect(Object.keys(store.moduleMap).length).toBe(0);
    });
  });
});
