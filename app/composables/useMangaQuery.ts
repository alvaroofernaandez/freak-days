import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useManga, type CreateMangaDTO } from './useManga'
import type { MangaEntry } from './useManga'
import { useToast } from './useToast'

const QUERY_KEYS = {
  all: ['manga'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
}

export function useMangaQuery() {
  const mangaApi = useManga()
  const queryClient = useQueryClient()
  const toast = useToast()

  const mangaListQuery = useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => mangaApi.fetchCollection(),
    staleTime: 1000 * 60 * 5,
  })

  const addMangaMutation = useMutation({
    mutationFn: (dto: CreateMangaDTO) => mangaApi.addManga(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() })
      toast.success('Manga añadido exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al añadir el manga')
    },
  })

  const addVolumeMutation = useMutation({
    mutationFn: ({ id, volume }: { id: string; volume: number }) =>
      mangaApi.addVolume(id, volume),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al añadir el tomo')
    },
  })

  const removeVolumeMutation = useMutation({
    mutationFn: ({ id, volume }: { id: string; volume: number }) =>
      mangaApi.removeVolume(id, volume),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el tomo')
    },
  })

  const deleteMangaMutation = useMutation({
    mutationFn: (id: string) => mangaApi.deleteManga(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.list() })
      const previousManga = queryClient.getQueryData<MangaEntry[]>(QUERY_KEYS.list())
      
      queryClient.setQueryData<MangaEntry[]>(QUERY_KEYS.list(), (old = []) =>
        old.filter(m => m.id !== id)
      )

      return { previousManga }
    },
    onSuccess: () => {
      toast.success('Manga eliminado')
    },
    onError: (error: Error, _, context) => {
      if (context?.previousManga) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousManga)
      }
      toast.error(error.message || 'Error al eliminar el manga')
    },
  })

  return {
    mangaList: mangaListQuery,
    addManga: addMangaMutation,
    addVolume: addVolumeMutation,
    removeVolume: removeVolumeMutation,
    deleteManga: deleteMangaMutation,
  }
}

