import { useAuthStore } from "~~/stores/auth";

export interface Workout {
  id: string;
  name: string;
  description: string | null;
  workoutDate: Date;
  durationMinutes: number | null;
  notes: string | null;
  status: 'in_progress' | 'completed';
  startedAt: Date | null;
  completedAt: Date | null;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  exerciseName: string;
  notes: string | null;
  orderIndex: number;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  restSeconds: number | null;
  notes: string | null;
}

export interface CreateWorkoutDTO {
  name: string;
  description?: string;
  workout_date: string;
  duration_minutes?: number;
  status?: 'in_progress' | 'completed';
}

export function useWorkouts() {
  const authStore = useAuthStore();

  async function fetchWorkouts(limit = 20): Promise<Workout[]> {
    if (!authStore.userId) return [];

    try {
      const data = await $fetch<Array<Record<string, unknown>>>("/api/workouts", {
        query: {
          userId: authStore.userId,
          limit,
        },
      });

      return (data ?? []).map(mapDbToWorkout);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      return [];
    }
  }

  async function getInProgressWorkout(): Promise<Workout | null> {
    if (!authStore.userId) return null;

    try {
      const data = await $fetch<Record<string, unknown> | null>(
        "/api/workouts/in-progress",
        {
          query: {
            userId: authStore.userId,
          },
        }
      );

      if (!data) return null;
      return mapDbToWorkout(data);
    } catch (error) {
      console.error("Error fetching in-progress workout:", error);
      return null;
    }
  }

  async function getWorkoutById(id: string): Promise<Workout | null> {
    try {
      const data = await $fetch<Record<string, unknown>>(`/api/workouts/${id}`);
      return mapDbToWorkout(data);
    } catch (error) {
      console.error("Error fetching workout:", error);
      return null;
    }
  }

  async function createWorkout(dto: CreateWorkoutDTO): Promise<Workout | null> {
    if (!authStore.userId) return null;

    try {
      const data = await $fetch<Record<string, unknown>>("/api/workouts", {
        method: "POST",
        body: {
          userId: authStore.userId,
          name: dto.name,
          description: dto.description,
          workout_date: dto.workout_date,
          duration_minutes: dto.duration_minutes,
          status: dto.status || "in_progress",
        },
      });

      return mapDbToWorkout(data);
    } catch (error) {
      console.error("Error creating workout:", error);
      return null;
    }
  }

  async function addExercise(
    workoutId: string,
    exerciseName: string
  ): Promise<WorkoutExercise | null> {
    try {
      const data = await $fetch<Record<string, unknown>>(
        `/api/workouts/${workoutId}/exercises`,
        {
          method: "POST",
          body: {
            exercise_name: exerciseName,
          },
        }
      );

      return {
        id: data.id as string,
        exerciseName: data.exercise_name as string,
        notes: data.notes as string | null,
        orderIndex: data.order_index as number,
        sets: [],
      };
    } catch (error) {
      console.error("Error adding exercise:", error);
      return null;
    }
  }

  async function addSet(
    exerciseId: string,
    set: {
      reps?: number;
      weight_kg?: number;
      rest_seconds?: number;
    }
  ): Promise<WorkoutSet | null> {
    try {
      const data = await $fetch<Record<string, unknown>>(
        `/api/workouts/exercises/${exerciseId}/sets`,
        {
          method: "POST",
          body: {
            reps: set.reps,
            weight_kg: set.weight_kg,
            rest_seconds: set.rest_seconds,
          },
        }
      );

      return {
        id: data.id as string,
        setNumber: data.set_number as number,
        reps: data.reps as number | null,
        weightKg: data.weight_kg as number | null,
        restSeconds: data.rest_seconds as number | null,
        notes: data.notes as string | null,
      };
    } catch (error) {
      console.error("Error adding set:", error);
      return null;
    }
  }

  async function updateSet(
    setId: string,
    updates: {
      reps?: number | null;
      weight_kg?: number | null;
      rest_seconds?: number | null;
    }
  ): Promise<WorkoutSet | null> {
    try {
      const data = await $fetch<Record<string, unknown>>(
        `/api/workouts/sets/${setId}`,
        {
          method: "PATCH" as any,
          body: {
            reps: updates.reps,
            weight_kg: updates.weight_kg,
            rest_seconds: updates.rest_seconds,
          },
        }
      );

      return {
        id: data.id as string,
        setNumber: data.set_number as number,
        reps: data.reps as number | null,
        weightKg: data.weight_kg as number | null,
        restSeconds: data.rest_seconds as number | null,
        notes: data.notes as string | null,
      };
    } catch (error) {
      console.error("Error updating set:", error);
      return null;
    }
  }

  async function deleteSet(setId: string): Promise<boolean> {
    try {
      await $fetch(`/api/workouts/sets/${setId}`, {
        method: "DELETE" as any,
      });
      return true;
    } catch (error) {
      console.error("Error deleting set:", error);
      return false;
    }
  }

  async function completeWorkout(workoutId: string, durationMinutes?: number): Promise<boolean> {
    try {
      await $fetch(`/api/workouts/${workoutId}`, {
        method: "PATCH" as any,
        body: {
          status: "completed",
          duration_minutes: durationMinutes,
        },
      });
      return true;
    } catch (error) {
      console.error("Error completing workout:", error);
      return false;
    }
  }

  async function deleteWorkout(id: string): Promise<boolean> {
    try {
      await $fetch(`/api/workouts/${id}`, {
        method: "DELETE" as any,
      });
      return true;
    } catch (error) {
      console.error("Error deleting workout:", error);
      return false;
    }
  }

  async function getWeeklyStats(): Promise<{
    count: number;
    totalMinutes: number;
  }> {
    if (!authStore.userId) return { count: 0, totalMinutes: 0 };

    try {
      const data = await $fetch<{ count: number; totalMinutes: number }>(
        "/api/workouts/weekly-stats",
        {
          query: {
            userId: authStore.userId,
          },
        }
      );

      return data;
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      return { count: 0, totalMinutes: 0 };
    }
  }

  function mapDbToWorkout(row: Record<string, unknown>): Workout {
    const exercises =
      (row.workout_exercises as Array<Record<string, unknown>>) ?? [];

    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | null,
      workoutDate: new Date(row.workout_date as string),
      durationMinutes: row.duration_minutes as number | null,
      notes: row.notes as string | null,
      status: (row.status as 'in_progress' | 'completed') || 'completed',
      startedAt: row.started_at ? new Date(row.started_at as string) : null,
      completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
      exercises: exercises
        .map((e) => {
          const sets = (e.workout_sets as Array<Record<string, unknown>>) ?? [];
          return {
            id: e.id as string,
            exerciseName: e.exercise_name as string,
            notes: e.notes as string | null,
            orderIndex: e.order_index as number,
            sets: sets
              .map((s) => ({
                id: s.id as string,
                setNumber: s.set_number as number,
                reps: s.reps as number | null,
                weightKg: s.weight_kg as number | null,
                restSeconds: s.rest_seconds as number | null,
                notes: s.notes as string | null,
              }))
              .sort((a, b) => a.setNumber - b.setNumber),
          };
        })
        .sort((a, b) => a.orderIndex - b.orderIndex),
    };
  }

  return {
    fetchWorkouts,
    getWorkoutById,
    getInProgressWorkout,
    createWorkout,
    addExercise,
    addSet,
    updateSet,
    deleteSet,
    completeWorkout,
    deleteWorkout,
    getWeeklyStats,
  };
}
