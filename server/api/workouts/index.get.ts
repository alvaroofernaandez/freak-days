import { getPrisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const userId = getQuery(event).userId as string;
  const limit = Number(getQuery(event).limit) || 20;

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: "User ID is required",
    });
  }

  try {
    const prisma = await getPrisma();
    const data = await prisma.workout.findMany({
      where: {
        userId,
      },
      include: {
        exercises: {
          include: {
            sets: {
              orderBy: {
                setNumber: "asc",
              },
            },
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
      orderBy: {
        workoutDate: "desc",
      },
      take: limit,
    });

    return data.map((workout: any) => ({
      id: workout.id,
      name: workout.name,
      description: workout.description,
      workout_date: workout.workoutDate.toISOString().split("T")[0],
      duration_minutes: workout.durationMinutes,
      notes: workout.notes,
      status: workout.status,
      started_at: workout.startedAt?.toISOString() || null,
      completed_at: workout.completedAt?.toISOString() || null,
      workout_exercises: workout.exercises.map((exercise: any) => ({
        id: exercise.id,
        exercise_name: exercise.exerciseName,
        notes: exercise.notes,
        order_index: exercise.orderIndex,
        workout_sets: exercise.sets.map((set: any) => ({
          id: set.id,
          set_number: set.setNumber,
          reps: set.reps,
          weight_kg: set.weightKg ? Number(set.weightKg) : null,
          rest_seconds: set.restSeconds,
          notes: set.notes,
        })),
      })),
    }));
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Error fetching workouts",
    });
  }
});
