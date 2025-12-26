import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnime } from '../../../app/composables/useAnime'
import { useAuthStore } from '../../../stores/auth'

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
}

vi.mock('../../../app/composables/useSupabase', () => ({
  useSupabase: () => mockSupabase,
}))

describe('useAnime', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchAnimeList', () => {
    it('should return empty array when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

      const animeApi = useAnime()
      const list = await animeApi.fetchAnimeList()

      expect(list).toEqual([])
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should fetch anime list when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockData = [
        {
          id: '1',
          title: 'Test Anime',
          status: 'watching',
          current_episode: 5,
          total_episodes: 12,
          score: null,
          notes: null,
          cover_url: null,
          start_date: null,
          end_date: null,
          rewatch_count: 0,
        },
      ]

      const queryChain = {
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      }
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(queryChain as any)

      const animeApi = useAnime()
      const list = await animeApi.fetchAnimeList()

      expect(list).toHaveLength(1)
      expect(list[0].title).toBe('Test Anime')
    })
  })

  describe('addAnime', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

      const animeApi = useAnime()
      const result = await animeApi.addAnime({
        title: 'Test',
        status: 'watching',
      })

      expect(result).toBe(null)
    })

    it('should return null when title is empty', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const animeApi = useAnime()
      const result = await animeApi.addAnime({
        title: '',
        status: 'watching',
      })

      expect(result).toBe(null)
    })

    it('should add anime when valid data is provided', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockData = {
        id: '1',
        title: 'Test Anime',
        status: 'watching',
        current_episode: 0,
        total_episodes: 12,
        score: null,
        notes: null,
        cover_url: null,
        start_date: null,
        end_date: null,
        rewatch_count: 0,
      }

      const insertChain = {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      }
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.insert.mockReturnValue(insertChain as any)

      const animeApi = useAnime()
      const result = await animeApi.addAnime({
        title: 'Test Anime',
        status: 'watching',
        total_episodes: 12,
      })

      expect(result).not.toBe(null)
      expect(result?.title).toBe('Test Anime')
    })
  })

  describe('updateStatus', () => {
    it('should update status successfully', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

      const animeApi = useAnime()
      // updateStatus no verifica autenticación, solo actualiza directamente
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: null } as any)

      const result = await animeApi.updateStatus('1', 'completed')

      expect(result).toBe(true)
    })

    it('should update status when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: null } as any)

      const animeApi = useAnime()
      const result = await animeApi.updateStatus('1', 'completed')

      expect(result).toBe(true)
    })
  })

  describe('deleteAnime', () => {
    it('should return false when delete fails', async () => {
      const deleteChain = {
        eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      }
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.delete.mockReturnValue(deleteChain as any)

      const animeApi = useAnime()
      const result = await animeApi.deleteAnime('1')

      expect(result).toBe(false)
    })

    it('should return true when delete succeeds', async () => {
      const deleteChain = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.delete.mockReturnValue(deleteChain as any)

      const animeApi = useAnime()
      const result = await animeApi.deleteAnime('1')

      expect(result).toBe(true)
    })
  })
})

