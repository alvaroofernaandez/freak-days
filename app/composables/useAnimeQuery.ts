import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useAnime, type CreateAnimeDTO, type AnimeStatus } from './useAnime'
import type { AnimeEntry } from './useAnime'
import { useToast } from './useToast'

const QUERY_KEYS = {
  all: ['anime'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  byStatus: (status: AnimeStatus) => [...QUERY_KEYS.lists(), status] as const,
}

export function useAnimeQuery() {
  const animeApi = useAnime()
  const queryClient = useQueryClient()
  const toast = useToast()

  const animeListQuery = useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => animeApi.fetchAnimeList(),
    staleTime: 1000 * 60 * 5,
  })

  const addAnimeMutation = useMutation({
    mutationFn: (dto: CreateAnimeDTO) => animeApi.addAnime(dto),
    onMutate: async (newAnime) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.list() })
      const previousAnime = queryClient.getQueryData<AnimeEntry[]>(QUERY_KEYS.list())
      
      const optimisticAnime: AnimeEntry = {
        id: `temp-${Date.now()}`,
        title: newAnime.title,
        status: newAnime.status,
        currentEpisode: 0,
        totalEpisodes: newAnime.total_episodes ?? null,
        score: newAnime.score ?? null,
        notes: null,
        coverUrl: null,
        startDate: null,
        endDate: null,
        rewatchCount: 0,
      }

      queryClient.setQueryData<AnimeEntry[]>(QUERY_KEYS.list(), (old = []) => [
        optimisticAnime,
        ...old,
      ])

      return { previousAnime }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() })
      toast.success('Anime añadido exitosamente')
    },
    onError: (error: Error, _, context) => {
      if (context?.previousAnime) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousAnime)
      }
      toast.error(error.message || 'Error al añadir el anime')
    },
  })

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, episode }: { id: string; episode: number }) =>
      animeApi.updateProgress(id, episode),
    onMutate: async ({ id, episode }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.list() })
      const previousAnime = queryClient.getQueryData<AnimeEntry[]>(QUERY_KEYS.list())
      
      queryClient.setQueryData<AnimeEntry[]>(QUERY_KEYS.list(), (old = []) =>
        old.map(a => a.id === id ? { ...a, currentEpisode: episode } : a)
      )

      return { previousAnime }
    },
    onError: (error: Error, _, context) => {
      if (context?.previousAnime) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousAnime)
      }
      toast.error(error.message || 'Error al actualizar el progreso')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AnimeStatus }) =>
      animeApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.list() })
      const previousAnime = queryClient.getQueryData<AnimeEntry[]>(QUERY_KEYS.list())
      
      queryClient.setQueryData<AnimeEntry[]>(QUERY_KEYS.list(), (old = []) =>
        old.map(a => a.id === id ? { ...a, status } : a)
      )

      return { previousAnime }
    },
    onSuccess: () => {
      toast.success('Estado actualizado')
    },
    onError: (error: Error, _, context) => {
      if (context?.previousAnime) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousAnime)
      }
      toast.error(error.message || 'Error al actualizar el estado')
    },
  })

  const deleteAnimeMutation = useMutation({
    mutationFn: (id: string) => animeApi.deleteAnime(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.list() })
      const previousAnime = queryClient.getQueryData<AnimeEntry[]>(QUERY_KEYS.list())
      
      queryClient.setQueryData<AnimeEntry[]>(QUERY_KEYS.list(), (old = []) =>
        old.filter(a => a.id !== id)
      )

      return { previousAnime }
    },
    onSuccess: () => {
      toast.success('Anime eliminado')
    },
    onError: (error: Error, _, context) => {
      if (context?.previousAnime) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousAnime)
      }
      toast.error(error.message || 'Error al eliminar el anime')
    },
  })

  return {
    animeList: animeListQuery,
    addAnime: addAnimeMutation,
    updateProgress: updateProgressMutation,
    updateStatus: updateStatusMutation,
    deleteAnime: deleteAnimeMutation,
  }
}

