import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useQuests, type CreateQuestDTO } from './useQuests'
import type { Quest } from '~~/domain/types'
import { DIFFICULTY_EXP } from '~~/domain/types'
import { useToast } from './useToast'
import { useProfile } from './useProfile'

const QUERY_KEYS = {
  all: ['quests'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: () => [...QUERY_KEYS.lists()] as const,
  completions: () => [...QUERY_KEYS.all, 'completions'] as const,
}

export function useQuestsQuery() {
  const questsApi = useQuests()
  const queryClient = useQueryClient()
  const toast = useToast()
  const profileApi = useProfile()

  const questsQuery = useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => questsApi.fetchQuests(),
    staleTime: 1000 * 60 * 2,
  })

  const completionsQuery = useQuery({
    queryKey: QUERY_KEYS.completions(),
    queryFn: () => questsApi.fetchTodayCompletions(),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 5,
  })

  const createQuestMutation = useMutation({
    mutationFn: (dto: CreateQuestDTO) => questsApi.createQuest(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list() })
      toast.success('Quest creada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la quest')
    },
  })

  const completeQuestMutation = useMutation({
    mutationFn: ({ questId, streakCount }: { questId: string; streakCount?: number }) =>
      questsApi.completeQuest(questId, streakCount),
    onMutate: async ({ questId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.completions() })
      const previousCompletions = queryClient.getQueryData<string[]>(QUERY_KEYS.completions())
      
      queryClient.setQueryData<string[]>(QUERY_KEYS.completions(), (old = []) => {
        if (!old.includes(questId)) {
          return [...old, questId]
        }
        return old
      })

      return { previousCompletions }
    },
    onSuccess: async (expEarned) => {
      await profileApi.addExp(expEarned)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.completions() })
      toast.success(`¡Quest completada! +${expEarned} EXP`)
    },
    onError: (error: Error, _, context) => {
      if (context?.previousCompletions) {
        queryClient.setQueryData(QUERY_KEYS.completions(), context.previousCompletions)
      }
      toast.error(error.message || 'Error al completar la quest')
    },
  })

  const deleteQuestMutation = useMutation({
    mutationFn: (id: string) => questsApi.deleteQuest(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.list() })
      const previousQuests = queryClient.getQueryData<Quest[]>(QUERY_KEYS.list())
      
      queryClient.setQueryData<Quest[]>(QUERY_KEYS.list(), (old = []) =>
        old.filter(q => q.id !== id)
      )

      return { previousQuests }
    },
    onSuccess: () => {
      toast.success('Quest eliminada')
    },
    onError: (error: Error, _, context) => {
      if (context?.previousQuests) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousQuests)
      }
      toast.error(error.message || 'Error al eliminar la quest')
    },
  })

  return {
    quests: questsQuery,
    completions: completionsQuery,
    createQuest: createQuestMutation,
    completeQuest: completeQuestMutation,
    deleteQuest: deleteQuestMutation,
  }
}

