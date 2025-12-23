import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useCalendar, type CreateReleaseDTO } from './useCalendar'
import type { Release } from './useCalendar'
import { useToast } from './useToast'

const QUERY_KEYS = {
  all: ['calendar'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  upcoming: (days: number) => [...QUERY_KEYS.lists(), 'upcoming', days] as const,
}

export function useCalendarQuery(daysAhead = 90) {
  const calendarApi = useCalendar()
  const queryClient = useQueryClient()
  const toast = useToast()

  const releasesQuery = useQuery({
    queryKey: QUERY_KEYS.upcoming(daysAhead),
    queryFn: () => calendarApi.fetchUpcoming(daysAhead),
    staleTime: 1000 * 60 * 10,
  })

  const addReleaseMutation = useMutation({
    mutationFn: (dto: CreateReleaseDTO) => calendarApi.addRelease(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      toast.success('Lanzamiento añadido exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al añadir el lanzamiento')
    },
  })

  const deleteReleaseMutation = useMutation({
    mutationFn: (id: string) => calendarApi.deleteRelease(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.upcoming(daysAhead) })
      const previousReleases = queryClient.getQueryData<Release[]>(QUERY_KEYS.upcoming(daysAhead))
      
      queryClient.setQueryData<Release[]>(QUERY_KEYS.upcoming(daysAhead), (old = []) =>
        old.filter(r => r.id !== id)
      )

      return { previousReleases }
    },
    onSuccess: () => {
      toast.success('Lanzamiento eliminado')
    },
    onError: (error: Error, _, context) => {
      if (context?.previousReleases) {
        queryClient.setQueryData(QUERY_KEYS.upcoming(daysAhead), context.previousReleases)
      }
      toast.error(error.message || 'Error al eliminar el lanzamiento')
    },
  })

  return {
    releases: releasesQuery,
    addRelease: addReleaseMutation,
    deleteRelease: deleteReleaseMutation,
  }
}

