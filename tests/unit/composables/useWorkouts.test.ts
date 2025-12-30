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
import { useWorkouts } from "../../../app/composables/useWorkouts";
import { useAuthStore } from "../../../stores/auth";

// Mock global $fetch
const mockFetch = vi.fn();

// Try to mock ofetch module
vi.mock("ofetch", () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}));

describe("useWorkouts", () => {
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

  describe("fetchWorkouts", () => {
    it("should return empty array when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const workoutsApi = useWorkouts();
      const workouts = await workoutsApi.fetchWorkouts();

      expect(workouts).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should fetch workouts when user is authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession({
        user: { id: "user-1" },
        access_token: "token",
      } as any);

      const mockData = [
        {
          id: "1",
          name: "Test Workout",
          description: null,
          workout_date: new Date().toISOString(),
          duration_minutes: 60,
          notes: null,
          status: "completed",
          started_at: null,
          completed_at: null,
          workout_exercises: [],
        },
      ];

      mockFetch.mockResolvedValue(mockData);

      const workoutsApi = useWorkouts();
      const workouts = await workoutsApi.fetchWorkouts();

      expect(workouts).toHaveLength(1);
      expect(workouts[0].name).toBe("Test Workout");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/workouts",
        expect.objectContaining({
          query: expect.objectContaining({ userId: "user-1" }),
        })
      );
    });
  });

  describe("createWorkout", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const workoutsApi = useWorkouts();
      const result = await workoutsApi.createWorkout({
        name: "Test",
        workout_date: new Date().toISOString(),
      });

      expect(result).toBe(null);
    });

    it("should create workout when valid data is provided", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockData = {
        id: "1",
        name: "Test Workout",
        workout_date: new Date().toISOString(),
        status: "in_progress",
        description: null,
        duration_minutes: null,
        notes: null,
        started_at: new Date().toISOString(),
        completed_at: null,
        workout_exercises: [],
      };

      mockFetch.mockResolvedValue(mockData);

      const workoutsApi = useWorkouts();
      const result = await workoutsApi.createWorkout({
        name: "Test Workout",
        workout_date: new Date().toISOString(),
      });

      expect(result).not.toBe(null);
      expect(result?.name).toBe("Test Workout");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/workouts",
        expect.objectContaining({
          method: "POST",
          body: expect.objectContaining({
            userId: "user-1",
            name: "Test Workout",
          }),
        })
      );
    });
  });

  describe("getInProgressWorkout", () => {
    it("should return null when user is not authenticated", async () => {
      const authStore = useAuthStore();
      authStore.setSession(null);

      const workoutsApi = useWorkouts();
      const result = await workoutsApi.getInProgressWorkout();

      expect(result).toBe(null);
    });

    it("should return workout when in progress workout exists", async () => {
      const authStore = useAuthStore();
      authStore.setSession({ user: { id: "user-1" } } as any);

      const mockData = {
        id: "1",
        name: "In Progress Workout",
        status: "in_progress",
        workout_date: new Date().toISOString(),
        workout_exercises: [],
      };

      mockFetch.mockResolvedValue(mockData);

      const workoutsApi = useWorkouts();
      const result = await workoutsApi.getInProgressWorkout();

      expect(result).not.toBe(null);
      expect(result?.name).toBe("In Progress Workout");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/workouts/in-progress",
        expect.objectContaining({
          query: expect.objectContaining({ userId: "user-1" }),
        })
      );
    });
  });
});
