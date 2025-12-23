import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useParties } from './useParties'
import type { Party } from './useParties'
import { useToast } from './useToast'

const QUERY_KEYS = {
  all: ['parties'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
}

export function usePartiesQuery() {
  const partiesApi = useParties()
  const queryClient = useQueryClient()
  const toast = useToast()

  const partiesQuery = useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => partiesApi.fetchUserParties(),
    staleTime: 1000 * 60 * 5,
  })

  const createPartyMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      partiesApi.createParty(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() })
      toast.success('Party creada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la party')
    },
  })

  const joinPartyMutation = useMutation({
    mutationFn: (code: string) => partiesApi.joinByCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() })
      toast.success('Te has unido a la party')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al unirse a la party. Verifica el código.')
    },
  })

  const leavePartyMutation = useMutation({
    mutationFn: (partyId: string) => partiesApi.leaveParty(partyId),
    onMutate: async (partyId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.list() })
      const previousParties = queryClient.getQueryData<Party[]>(QUERY_KEYS.list())
      
      queryClient.setQueryData<Party[]>(QUERY_KEYS.list(), (old = []) =>
        old.filter(p => p.id !== partyId)
      )

      return { previousParties }
    },
    onSuccess: () => {
      toast.success('Has salido de la party')
    },
    onError: (error: Error, _, context) => {
      if (context?.previousParties) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousParties)
      }
      toast.error(error.message || 'Error al salir de la party')
    },
  })

  return {
    parties: partiesQuery,
    createParty: createPartyMutation,
    joinParty: joinPartyMutation,
    leaveParty: leavePartyMutation,
  }
}

