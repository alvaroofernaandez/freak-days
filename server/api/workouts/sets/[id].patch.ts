import { getPrisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const setId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!setId) {
    throw createError({
      statusCode: 400,
      message: "Set ID is required",
    });
  }

  try {
    const prisma = await getPrisma();
    const updateData: {
      reps?: number | null;
      weightKg?: number | null;
      restSeconds?: number | null;
      notes?: string | null;
    } = {};

    if (body.reps !== undefined) {
      updateData.reps = body.reps;
    }
    if (body.weight_kg !== undefined) {
      updateData.weightKg = body.weight_kg;
    }
    if (body.rest_seconds !== undefined) {
      updateData.restSeconds = body.rest_seconds;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
    }

    const data = await prisma.workoutSet.update({
      where: { id: setId },
      data: updateData,
    });

    return {
      id: data.id,
      set_number: data.setNumber,
      reps: data.reps,
      weight_kg: data.weightKg ? Number(data.weightKg) : null,
      rest_seconds: data.restSeconds,
      notes: data.notes,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Error updating set",
    });
  }
});

