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
import { useQuests } from "../../../app/composables/useQuests";
import { useAuthStore } from "../../../stores/auth";

// Mock global $fetch
const mockFetch = vi.fn();

// Try to mock ofetch module as well
vi.mock("ofetch", () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}));

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  rpc: vi.fn(() => mockSupabase),
};

vi.mock("../../../app/composables/useSupabase", () => ({
  useSupabase: () => mockSupabase,
}));

describe("useQuests", () => {
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

  describe("fetchQuests", () => {
    it("should return empty array when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const questsApi = useQuests();
      const quests = await questsApi.fetchQuests();

      expect(quests).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should fetch quests when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({
        user: { id: "user-1" },
        access_token: "token",
      } as any);

      const mockData = [
        {
          id: "1",
          title: "Test Quest",
          description: "Test description",
          difficulty: "easy",
          expReward: 10,
          dueDate: null,
          dueTime: null,
          reminderMinutesBefore: null,
          createdAt: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValue(mockData);

      const questsApi = useQuests();
      const quests = await questsApi.fetchQuests();

      expect(quests).toHaveLength(1);
      expect(quests[0].title).toBe("Test Quest");
      expect(mockFetch).toHaveBeenCalledWith("/api/quests?userId=user-1");
    });
  });

  describe("createQuest", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const questsApi = useQuests();
      const result = await questsApi.createQuest({
        title: "Test",
        difficulty: "easy",
        exp_reward: 10,
      });

      expect(result).toBe(null);
    });

    it("should create quest when valid data is provided", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockData = {
        id: "1",
        title: "Test Quest",
        difficulty: "easy",
        expReward: 10,
        description: null,
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue(mockData);

      const questsApi = useQuests();
      const result = await questsApi.createQuest({
        title: "Test Quest",
        difficulty: "easy",
        exp_reward: 10,
      });

      expect(result).not.toBe(null);
      expect(result?.title).toBe("Test Quest");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/quests",
        expect.objectContaining({
          method: "POST",
          body: expect.objectContaining({
            userId: "user-1",
            title: "Test Quest",
          }),
        })
      );
    });
  });

  describe("completeQuest", () => {
    it("should return 0 when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const questsApi = useQuests();
      const exp = await questsApi.completeQuest("1");

      expect(exp).toBe(0);
    });

    it("should complete quest and return exp reward", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      // Mock fetchQuests call inside completeQuest -> getQuestById
      // Step 1: fetchQuests mock
      const mockQuestList = [
        {
          id: "1",
          title: "Test Quest",
          difficulty: "easy",
          expReward: 10,
          createdAt: new Date().toISOString(),
        },
      ];

      // Step 2: complete API call reply
      const mockCompleteResult = { expEarned: 10 };

      mockFetch
        .mockResolvedValueOnce(mockQuestList) // for getQuestById -> fetchQuests
        .mockResolvedValueOnce(mockCompleteResult); // for /complete call

      const questsApi = useQuests();
      const exp = await questsApi.completeQuest("1", 1);

      expect(exp).toBe(10);

      // Verify calls order/args
      expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/quests?userId=user-1");
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "/api/quests/1/complete",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });
});
