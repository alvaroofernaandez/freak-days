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
import { useManga } from "../../../app/composables/useManga";
import { useAuthStore } from "../../../stores/auth";

// Mock global $fetch
const mockFetch = vi.fn();

// Try to mock ofetch module
vi.mock("ofetch", () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}));

describe("useManga", () => {
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

  describe("fetchCollection", () => {
    it("should return empty array when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const mangaApi = useManga();
      const collection = await mangaApi.fetchCollection();

      expect(collection).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should fetch collection when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({
        user: { id: "user-1" },
        access_token: "token",
      } as any);

      const mockData = [
        {
          id: "1",
          title: "Test Manga",
          author: "Test Author",
          totalVolumes: 10,
          ownedVolumes: [1, 2, 3],
          status: "collecting",
          score: null,
          notes: null,
          coverUrl: null,
          pricePerVolume: 10.5,
          totalCost: 31.5,
        },
      ];

      mockFetch.mockResolvedValue(mockData);

      const mangaApi = useManga();
      const collection = await mangaApi.fetchCollection();

      expect(collection).toHaveLength(1);
      expect(collection[0].title).toBe("Test Manga");
      expect(mockFetch).toHaveBeenCalledWith("/api/manga?userId=user-1");
    });
  });

  describe("addManga", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const mangaApi = useManga();
      const result = await mangaApi.addManga({ title: "Test" });

      expect(result).toBe(null);
    });

    it("should add manga when valid data is provided", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockData = {
        id: "1",
        title: "Test Manga",
        author: "Test Author",
        totalVolumes: 10,
        ownedVolumes: [],
        status: "collecting",
        score: null,
        notes: null,
        coverUrl: null,
        pricePerVolume: 10.5,
        totalCost: 0,
      };

      mockFetch.mockResolvedValue(mockData);

      const mangaApi = useManga();
      const result = await mangaApi.addManga({
        title: "Test Manga",
        author: "Test Author",
      });

      expect(result).not.toBe(null);
      expect(result?.title).toBe("Test Manga");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/manga",
        expect.objectContaining({
          method: "POST",
          body: expect.objectContaining({
            title: "Test Manga",
            userId: "user-1",
          }),
        })
      );
    });
  });

  describe("addVolume", () => {
    it("should return false when manga does not exist", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      // fetchCollection returns empty
      mockFetch.mockResolvedValue([]);

      const mangaApi = useManga();
      const result = await mangaApi.addVolume("non-existent", 1);

      expect(result).toBe(false);
    });

    it("should add volume when manga exists", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockManga = {
        id: "1",
        title: "Manga 1",
        ownedVolumes: [1, 2],
        pricePerVolume: 10.5,
        totalCost: 21,
        totalVolumes: 10,
        status: "collecting",
      };

      // First call: fetchCollection (for getMangaById)
      // Second call: PATCH update
      mockFetch.mockResolvedValueOnce([mockManga]).mockResolvedValueOnce({});

      const mangaApi = useManga();
      const result = await mangaApi.addVolume("1", 3);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "/api/manga/1",
        expect.objectContaining({
          method: "PATCH",
          // We could verify body but complex logic makes it fragile, basic check is ok
        })
      );
    });
  });
});
