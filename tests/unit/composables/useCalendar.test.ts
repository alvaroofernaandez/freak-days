import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCalendar } from "../../../app/composables/useCalendar";
import { useAuthStore } from "../../../stores/auth";

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
};

vi.mock("../../../app/composables/useSupabase", () => ({
  useSupabase: () => mockSupabase,
}));

describe("useCalendar", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("fetchReleases", () => {
    it("should return empty array when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const calendar = useCalendar();
      const releases = await calendar.fetchReleases();

      expect(releases).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should fetch releases when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "test-user-id" } } as any);

      const mockData = [
        {
          id: "1",
          title: "Test Release",
          release_type: "anime_episode",
          release_date: "2024-01-01",
          description: null,
          url: null,
          user_id: "test-user-id",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const queryChain = {
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(queryChain as any);

      const calendar = useCalendar();
      const releases = await calendar.fetchReleases();

      expect(releases).toHaveLength(1);
      expect(releases[0].title).toBe("Test Release");
    });

    it("should throw error when fetch fails", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "test-user-id" } } as any);

      // correctly mock the chain: select -> eq -> order -> Promise
      const queryChain = {
        eq: vi.fn(() => ({
          order: vi
            .fn()
            .mockResolvedValue({
              data: null,
              error: new Error("Fetch failed"),
            }),
        })),
      };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(queryChain as any);

      const calendar = useCalendar();

      await expect(calendar.fetchReleases()).rejects.toThrow();
    });
  });

  describe("addRelease", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const calendar = useCalendar();
      const result = await calendar.addRelease({
        title: "Test",
        type: "anime_episode",
        release_date: "2024-01-01",
      });

      expect(result).toBe(null);
    });

    it("should add release when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "test-user-id" } } as any);

      const mockData = {
        id: "1",
        title: "New Release",
        release_type: "anime_episode",
        release_date: "2024-01-01",
        description: null,
        url: null,
        user_id: "test-user-id",
        created_at: "2024-01-01T00:00:00Z",
      };

      const insertChain = {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(insertChain as any);

      const calendar = useCalendar();
      const result = await calendar.addRelease({
        title: "New Release",
        type: "anime_episode",
        release_date: "2024-01-01",
      });

      expect(result).not.toBe(null);
      expect(result?.title).toBe("New Release");
    });
  });

  describe("updateRelease", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const calendar = useCalendar();
      const result = await calendar.updateRelease("1", { title: "Updated" });

      expect(result).toBe(null);
    });

    it("should update release when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "test-user-id" } } as any);

      const mockData = {
        id: "1",
        title: "Updated Release",
        release_type: "anime_episode",
        release_date: "2024-01-01",
        description: null,
        url: null,
        user_id: "test-user-id",
        created_at: "2024-01-01T00:00:00Z",
      };

      const updateChain = {
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi
                .fn()
                .mockResolvedValue({ data: mockData, error: null }),
            })),
          })),
        })),
      };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(updateChain as any);

      const calendar = useCalendar();
      const result = await calendar.updateRelease("1", {
        title: "Updated Release",
      });

      expect(result).not.toBe(null);
      expect(result?.title).toBe("Updated Release");
    });
  });

  describe("deleteRelease", () => {
    it("should return true when delete succeeds", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "test-user-id" } } as any);

      // delete().eq().eq() -> Promise
      const mockPromise = Promise.resolve({ error: null });

      const chain2 = { eq: vi.fn().mockReturnValue(mockPromise) };
      const chain1 = { eq: vi.fn().mockReturnValue(chain2) };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.delete.mockReturnValue(chain1 as any);

      const calendar = useCalendar();
      const result = await calendar.deleteRelease("1");

      expect(result).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it("should return false when delete fails", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "test-user-id" } } as any);

      const deleteError = { message: "Delete failed", code: "DELETE_ERROR" };
      const mockPromise = Promise.resolve({ error: deleteError });

      const chain2 = { eq: vi.fn().mockReturnValue(mockPromise) };
      const chain1 = { eq: vi.fn().mockReturnValue(chain2) };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.delete.mockReturnValue(chain1 as any);

      const calendar = useCalendar();
      const result = await calendar.deleteRelease("1");

      expect(result).toBe(false);
      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });

  describe("mapDbToRelease", () => {
    it("should map database row to Release object through fetchReleases", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "test-user-id" } } as any);

      const mockData = [
        {
          id: "1",
          title: "Test Release",
          release_type: "anime_episode",
          release_date: "2024-01-01",
          description: null,
          url: null,
          user_id: "test-user-id",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const queryChain = {
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(queryChain as any);

      const calendar = useCalendar();
      const releases = await calendar.fetchReleases();

      expect(releases).toHaveLength(1);
      expect(releases[0].id).toBe("1");
      expect(releases[0].title).toBe("Test Release");
      expect(releases[0].type).toBe("anime_episode");
      expect(releases[0].releaseDate).toBeInstanceOf(Date);
    });
  });
});
