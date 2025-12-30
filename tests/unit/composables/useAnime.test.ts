import { createPinia, setActivePinia } from "pinia";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { useAnime } from "../../../app/composables/useAnime";
import { useAuthStore } from "../../../stores/auth";

// Mock global $fetch
const mockFetch = vi.fn();

// Try to mock ofetch module as well
vi.mock("ofetch", () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}));

describe("useAnime", () => {
  beforeAll(() => {
    vi.stubGlobal("$fetch", mockFetch);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("fetchAnimeList", () => {
    it("should return empty array when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const animeApi = useAnime();
      const list = await animeApi.fetchAnimeList();

      expect(list).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should fetch anime list when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({
        user: { id: "user-1" },
        access_token: "token",
      } as any);

      const mockData = [
        {
          id: "1",
          title: "Test Anime",
          status: "watching",
          currentEpisode: 5,
          totalEpisodes: 12,
          score: null,
          notes: null,
          coverUrl: null,
          startDate: null,
          endDate: null,
          rewatchCount: 0,
        },
      ];

      mockFetch.mockResolvedValue(mockData);

      const animeApi = useAnime();
      const list = await animeApi.fetchAnimeList();

      expect(list).toHaveLength(1);
      expect(list[0].title).toBe("Test Anime");
      expect(mockFetch).toHaveBeenCalledWith("/api/anime?userId=user-1");
    });
  });

  describe("addAnime", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const animeApi = useAnime();
      const result = await animeApi.addAnime({
        title: "Test",
        status: "watching",
      });

      expect(result).toBe(null);
    });

    it("should return null when title is empty", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const animeApi = useAnime();
      const result = await animeApi.addAnime({
        title: "",
        status: "watching",
      });

      expect(result).toBe(null);
    });

    it("should add anime when valid data is provided", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockData = {
        id: "1",
        title: "Test Anime",
        status: "watching",
        currentEpisode: 0,
        totalEpisodes: 12,
        score: null,
        notes: null,
        coverUrl: null,
        startDate: null,
        endDate: null,
        rewatchCount: 0,
      };

      mockFetch.mockResolvedValue(mockData);

      const animeApi = useAnime();
      const result = await animeApi.addAnime({
        title: "Test Anime",
        status: "watching",
        total_episodes: 12,
      });

      expect(result).not.toBe(null);
      expect(result?.title).toBe("Test Anime");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/anime",
        expect.objectContaining({
          method: "POST",
          body: expect.objectContaining({
            userId: "user-1",
            title: "Test Anime",
            status: "watching",
            total_episodes: 12,
          }),
        })
      );
    });
  });

  describe("updateStatus", () => {
    it("should update status successfully", async () => {
      mockFetch.mockResolvedValue({});

      const animeApi = useAnime();
      const result = await animeApi.updateStatus("1", "completed");

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/anime/1",
        expect.objectContaining({
          method: "PATCH",
          body: expect.objectContaining({ status: "completed" }),
        })
      );
    });
  });

  describe("deleteAnime", () => {
    it("should return false when delete fails", async () => {
      mockFetch.mockRejectedValue(new Error("Delete failed"));

      const animeApi = useAnime();
      const result = await animeApi.deleteAnime("1");

      expect(result).toBe(false);
    });

    it("should return true when delete succeeds", async () => {
      mockFetch.mockResolvedValue({});

      const animeApi = useAnime();
      const result = await animeApi.deleteAnime("1");

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/anime/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });
});
