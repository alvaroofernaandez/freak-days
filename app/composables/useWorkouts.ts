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
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function fetchWorkouts(limit = 20): Promise<Workout[]> {
    if (!authStore.userId) return [];

    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_exercises (
          *,
          workout_sets (*)
        )
      `
      )
      .eq("user_id", authStore.userId)
      .order("workout_date", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map(mapDbToWorkout);
  }

  async function getInProgressWorkout(): Promise<Workout | null> {
    if (!authStore.userId) return null;

    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_exercises (
          *,
          workout_sets (*)
        )
      `
      )
      .eq("user_id", authStore.userId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapDbToWorkout(data);
  }

  async function getWorkoutById(id: string): Promise<Workout | null> {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_exercises (
          *,
          workout_sets (*)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) return null;
    return data ? mapDbToWorkout(data) : null;
  }

  async function createWorkout(dto: CreateWorkoutDTO): Promise<Workout | null> {
    if (!authStore.userId) return null;

    const status = dto.status || 'in_progress';
    const now = new Date().toISOString();

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        user_id: authStore.userId,
        name: dto.name,
        description: dto.description,
        workout_date: dto.workout_date,
        duration_minutes: dto.duration_minutes,
        status: status,
        started_at: status === 'in_progress' ? now : null,
      })
      .select()
      .single();

    if (workoutError) throw workoutError;
    if (!workout) return null;

    return getWorkoutById(workout.id);
  }

  async function addExercise(
    workoutId: string,
    exerciseName: string
  ): Promise<WorkoutExercise | null> {
    const workout = await getWorkoutById(workoutId);
    if (!workout) return null;

    const { data, error } = await supabase
      .from("workout_exercises")
      .insert({
        workout_id: workoutId,
        exercise_name: exerciseName,
        order_index: workout.exercises.length,
      })
      .select()
      .single();

    if (error) return null;

    return {
      id: data.id,
      exerciseName: data.exercise_name,
      notes: data.notes,
      orderIndex: data.order_index,
      sets: [],
    };
  }

  async function addSet(
    exerciseId: string,
    set: {
      reps?: number;
      weight_kg?: number;
      rest_seconds?: number;
    }
  ): Promise<WorkoutSet | null> {
    const { data: exercise } = await supabase
      .from("workout_exercises")
      .select("id")
      .eq("id", exerciseId)
      .single();

    if (!exercise) return null;

    const { data: existingSets } = await supabase
      .from("workout_sets")
      .select("set_number")
      .eq("exercise_id", exerciseId)
      .order("set_number", { ascending: false })
      .limit(1);

    const nextSetNumber = existingSets && existingSets.length > 0
      ? existingSets[0].set_number + 1
      : 1;

    const { data, error } = await supabase
      .from("workout_sets")
      .insert({
        exercise_id: exerciseId,
        set_number: nextSetNumber,
        reps: set.reps,
        weight_kg: set.weight_kg,
        rest_seconds: set.rest_seconds,
      })
      .select()
      .single();

    if (error) return null;

    return {
      id: data.id,
      setNumber: data.set_number,
      reps: data.reps,
      weightKg: data.weight_kg,
      restSeconds: data.rest_seconds,
      notes: data.notes,
    };
  }

  async function completeWorkout(workoutId: string, durationMinutes?: number): Promise<boolean> {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from("workouts")
      .update({
        status: 'completed',
        completed_at: now,
        duration_minutes: durationMinutes,
      })
      .eq("id", workoutId);

    return !error;
  }

  async function deleteWorkout(id: string): Promise<boolean> {
    const { error } = await supabase.from("workouts").delete().eq("id", id);

    return !error;
  }

  async function getWeeklyStats(): Promise<{
    count: number;
    totalMinutes: number;
  }> {
    if (!authStore.userId) return { count: 0, totalMinutes: 0 };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("workouts")
      .select("duration_minutes")
      .eq("user_id", authStore.userId)
      .gte("workout_date", weekAgo.toISOString().split("T")[0]);

    if (error) return { count: 0, totalMinutes: 0 };

    const workouts = data ?? [];
    return {
      count: workouts.length,
      totalMinutes: workouts.reduce(
        (sum, w) => sum + (w.duration_minutes ?? 0),
        0
      ),
    };
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
    completeWorkout,
    deleteWorkout,
    getWeeklyStats,
  };
}
