import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useWorkouts, type CreateWorkoutDTO } from './useWorkouts'
import type { Workout } from './useWorkouts'
import { useToast } from './useToast'

const QUERY_KEYS = {
  all: ['workouts'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  stats: () => [...QUERY_KEYS.all, 'stats'] as const,
}

export function useWorkoutsQuery() {
  const workoutsApi = useWorkouts()
  const queryClient = useQueryClient()
  const toast = useToast()

  const workoutsQuery = useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => workoutsApi.fetchWorkouts(),
    staleTime: 1000 * 60 * 5,
  })

  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: () => workoutsApi.getWeeklyStats(),
    staleTime: 1000 * 60 * 2,
  })

  const createWorkoutMutation = useMutation({
    mutationFn: (dto: CreateWorkoutDTO) => workoutsApi.createWorkout(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() })
      toast.success('Entrenamiento registrado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar el entrenamiento')
    },
  })

  const deleteWorkoutMutation = useMutation({
    mutationFn: (id: string) => workoutsApi.deleteWorkout(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.list() })
      const previousWorkouts = queryClient.getQueryData<Workout[]>(QUERY_KEYS.list())
      
      queryClient.setQueryData<Workout[]>(QUERY_KEYS.list(), (old = []) =>
        old.filter(w => w.id !== id)
      )

      return { previousWorkouts }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() })
      toast.success('Entrenamiento eliminado')
    },
    onError: (error: Error, _, context) => {
      if (context?.previousWorkouts) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousWorkouts)
      }
      toast.error(error.message || 'Error al eliminar el entrenamiento')
    },
  })

  return {
    workouts: workoutsQuery,
    stats: statsQuery,
    createWorkout: createWorkoutMutation,
    deleteWorkout: deleteWorkoutMutation,
  }
}

