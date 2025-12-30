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
import { useProfile } from "../../../app/composables/useProfile";
import { useAuthStore } from "../../../stores/auth";

// Mock global $fetch
const mockFetch = vi.fn();

// Try to mock ofetch module
vi.mock("ofetch", () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}));

const mockStorageBucket = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
};

const mockSupabase = {
  storage: {
    from: vi.fn(() => mockStorageBucket),
  },
};

vi.mock("../../../app/composables/useSupabase", () => ({
  useSupabase: () => mockSupabase,
}));

describe("useProfile", () => {
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

  describe("fetchProfile", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const profileApi = useProfile();
      const profile = await profileApi.fetchProfile();

      expect(profile).toBe(null);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should fetch profile when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({
        user: { id: "user-1" },
        access_token: "token",
      } as any);

      const mockData = {
        id: "user-1",
        username: "testuser",
        displayName: "Test User",
        avatarUrl: null,
        bannerUrl: null,
        totalExp: 100,
        level: 1,
        bio: null,
        favoriteAnimeId: null,
        favoriteMangaId: null,
        location: null,
        website: null,
        socialLinks: {},
      };

      mockFetch.mockResolvedValue(mockData);

      const profileApi = useProfile();
      const profile = await profileApi.fetchProfile();

      expect(profile).not.toBe(null);
      expect(profile?.username).toBe("testuser");
      expect(mockFetch).toHaveBeenCalledWith("/api/profile/user-1");
    });

    it("should return null when fetch fails", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      mockFetch.mockRejectedValue(new Error("Not found"));

      const profileApi = useProfile();
      const profile = await profileApi.fetchProfile();

      expect(profile).toBe(null);
    });
  });

  describe("updateProfile", () => {
    it("should return false when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const profileApi = useProfile();
      const result = await profileApi.updateProfile({ username: "newuser" });

      expect(result).toBe(false);
    });

    it("should update profile when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      mockFetch.mockResolvedValue({});

      const profileApi = useProfile();
      const result = await profileApi.updateProfile({ username: "newuser" });

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/profile/user-1",
        expect.objectContaining({
          method: "PUT",
          body: expect.objectContaining({ username: "newuser" }),
        })
      );
    });
  });

  describe("uploadBanner", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const profileApi = useProfile();
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = await profileApi.uploadBanner(file);

      expect(result).toBe(null);
      expect(mockSupabase.storage.from).not.toHaveBeenCalled();
    });

    it("should upload banner and return URL when successful", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const publicUrl = "https://example.com/banners/user-1/banner.jpg";

      mockSupabase.storage.from.mockReturnValue(mockStorageBucket);
      mockStorageBucket.upload.mockResolvedValue({ error: null });
      mockStorageBucket.getPublicUrl.mockReturnValue({ data: { publicUrl } });

      // Mock updateProfile called after upload
      mockFetch.mockResolvedValue({});

      const profileApi = useProfile();
      const result = await profileApi.uploadBanner(mockFile);

      expect(result).toBe(publicUrl);
      expect(mockStorageBucket.upload).toHaveBeenCalled();
      expect(mockStorageBucket.getPublicUrl).toHaveBeenCalled();
      // Verify updateProfile call via $fetch
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/profile/user-1",
        expect.objectContaining({
          method: "PUT",
          body: expect.objectContaining({ banner_url: publicUrl }),
        })
      );
    });

    it("should return null when upload fails", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      mockSupabase.storage.from.mockReturnValue(mockStorageBucket);
      mockStorageBucket.upload.mockResolvedValue({
        error: new Error("Upload failed"),
      });

      const profileApi = useProfile();
      const result = await profileApi.uploadBanner(mockFile);

      expect(result).toBe(null);
    });
  });

  describe("deleteBanner", () => {
    it("should return false when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const profileApi = useProfile();
      const result = await profileApi.deleteBanner();

      expect(result).toBe(false);
    });

    it("should delete banner and return true when successful", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockProfileData = {
        id: "user-1",
        username: "testuser",
        bannerUrl: "https://example.com/banners/user-1/banner.jpg",
      };

      // 1. fetchProfile -> $fetch GET
      // 2. delete storage -> Supabase
      // 3. updateProfile -> $fetch PUT

      mockFetch
        .mockResolvedValueOnce(mockProfileData) // fetchProfile
        .mockResolvedValueOnce({}); // updateProfile

      mockSupabase.storage.from.mockReturnValue(mockStorageBucket);
      mockStorageBucket.remove.mockResolvedValue({ error: null });

      const profileApi = useProfile();
      const result = await profileApi.deleteBanner();

      expect(result).toBe(true);
      expect(mockStorageBucket.remove).toHaveBeenCalledWith([
        "user-1/banner.jpg",
      ]);
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "/api/profile/user-1",
        expect.objectContaining({
          method: "PUT",
          body: expect.objectContaining({ banner_url: null }),
        })
      );
    });

    it("should return false when profile has no banner", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockProfile = {
        id: "user-1",
        username: "testuser",
        bannerUrl: null,
      };

      mockFetch.mockResolvedValueOnce(mockProfile);

      const profileApi = useProfile();
      const result = await profileApi.deleteBanner();

      expect(result).toBe(false);
    });
  });

  describe("expForNextLevel", () => {
    it("should calculate exp for next level correctly", () => {
      const profileApi = useProfile();

      const result1 = profileApi.expForNextLevel(0);
      expect(result1.current).toBe(0);
      expect(result1.needed).toBe(100);
      expect(result1.progress).toBe(0);

      const result2 = profileApi.expForNextLevel(50);
      expect(result2.current).toBe(50);
      expect(result2.needed).toBe(100);
      expect(result2.progress).toBe(50);

      const result3 = profileApi.expForNextLevel(150);
      expect(result3.current).toBe(50);
      expect(result3.needed).toBe(100);
      expect(result3.progress).toBe(50);
    });
  });
});
