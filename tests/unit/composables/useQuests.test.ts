import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuests } from '~/app/composables/useQuests'
import { useAuthStore } from '~~/stores/auth'

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  rpc: vi.fn(() => mockSupabase),
}

vi.mock('~/app/composables/useSupabase', () => ({
  useSupabase: () => mockSupabase,
}))

describe('useQuests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchQuests', () => {
    it('should return empty array when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const questsApi = useQuests()
      const quests = await questsApi.fetchQuests()

      expect(quests).toEqual([])
    })

    it('should fetch quests when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = [
        {
          id: '1',
          title: 'Test Quest',
          description: 'Test description',
          difficulty: 'easy',
          exp_reward: 10,
          is_recurring: false,
          recurrence_pattern: null,
          due_date: null,
          due_time: null,
          reminder_minutes_before: null,
          active: true,
          created_at: new Date().toISOString(),
        },
      ]

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({ data: mockData, error: null })

      const questsApi = useQuests()
      const quests = await questsApi.fetchQuests()

      expect(quests).toHaveLength(1)
      expect(quests[0].title).toBe('Test Quest')
    })
  })

  describe('createQuest', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const questsApi = useQuests()
      const result = await questsApi.createQuest({
        title: 'Test',
        difficulty: 'easy',
        exp_reward: 10,
      })

      expect(result).toBe(null)
    })

    it('should create quest when valid data is provided', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = {
        id: '1',
        title: 'Test Quest',
        difficulty: 'easy',
        exp_reward: 10,
      }

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null })

      const questsApi = useQuests()
      const result = await questsApi.createQuest({
        title: 'Test Quest',
        difficulty: 'easy',
        exp_reward: 10,
      })

      expect(result).not.toBe(null)
      expect(result?.title).toBe('Test Quest')
    })
  })

  describe('completeQuest', () => {
    it('should return 0 when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const questsApi = useQuests()
      const exp = await questsApi.completeQuest('1')

      expect(exp).toBe(0)
    })

    it('should complete quest and return exp reward', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.insert.mockResolvedValue({ error: null })
      mockSupabase.rpc.mockResolvedValue({ data: 10, error: null })

      const questsApi = useQuests()
      const exp = await questsApi.completeQuest('1', 1)

      expect(exp).toBe(10)
    })
  })
})

