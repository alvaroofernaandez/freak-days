import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuests } from '../../../app/composables/useQuests'
import { useAuthStore } from '../../../stores/auth'

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

vi.mock('../../../app/composables/useSupabase', () => ({
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
      authStore.setSession(null)

      const questsApi = useQuests()
      const quests = await questsApi.fetchQuests()

      expect(quests).toEqual([])
    })

    it('should fetch quests when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

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

      const queryChain = {
        eq: vi.fn()
          .mockReturnValueOnce({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            })),
          }),
      }
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(queryChain as any)

      const questsApi = useQuests()
      const quests = await questsApi.fetchQuests()

      expect(quests).toHaveLength(1)
      expect(quests[0].title).toBe('Test Quest')
    })
  })

  describe('createQuest', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

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
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockData = {
        id: '1',
        title: 'Test Quest',
        difficulty: 'easy',
        exp_reward: 10,
      }

      const insertChain = {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      }
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.insert.mockReturnValue(insertChain as any)

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
      authStore.setSession(null)

      const questsApi = useQuests()
      const exp = await questsApi.completeQuest('1')

      expect(exp).toBe(0)
    })

    it('should complete quest and return exp reward', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockQuest = {
        id: '1',
        title: 'Test Quest',
        difficulty: 'easy',
        exp_reward: 10,
        description: null,
        is_recurring: false,
        recurrence_pattern: null,
        due_date: null,
        due_time: null,
        reminder_minutes_before: null,
        active: true,
        created_at: new Date().toISOString(),
      }

      const getQuestChain = {
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockQuest, error: null }),
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => getQuestChain),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        } as any)

      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: 10, error: null })

      const questsApi = useQuests()
      const exp = await questsApi.completeQuest('1', 1)

      expect(exp).toBe(10)
    })
  })
})

