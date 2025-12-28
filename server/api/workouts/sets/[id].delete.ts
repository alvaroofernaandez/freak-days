import { getPrisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const setId = getRouterParam(event, "id");

  if (!setId) {
    throw createError({
      statusCode: 400,
      message: "Set ID is required",
    });
  }

  try {
    const prisma = await getPrisma();
    await prisma.workoutSet.delete({
      where: { id: setId },
    });

    return { success: true };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Error deleting set",
    });
  }
});

