import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnime } from '~/app/composables/useAnime'
import { useAuthStore } from '~~/stores/auth'

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

vi.mock('~/app/composables/useSupabase', () => ({
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
      authStore.userId = null

      const animeApi = useAnime()
      const list = await animeApi.fetchAnimeList()

      expect(list).toEqual([])
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should fetch anime list when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

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

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({ data: mockData, error: null })

      const animeApi = useAnime()
      const list = await animeApi.fetchAnimeList()

      expect(list).toHaveLength(1)
      expect(list[0].title).toBe('Test Anime')
    })
  })

  describe('addAnime', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const animeApi = useAnime()
      const result = await animeApi.addAnime({
        title: 'Test',
        status: 'watching',
      })

      expect(result).toBe(null)
    })

    it('should return null when title is empty', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const animeApi = useAnime()
      const result = await animeApi.addAnime({
        title: '',
        status: 'watching',
      })

      expect(result).toBe(null)
    })

    it('should add anime when valid data is provided', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

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

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null })

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

  describe('updateAnime', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const animeApi = useAnime()
      const result = await animeApi.updateAnime('1', { status: 'completed' })

      expect(result).toBe(null)
    })

    it('should update anime when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = {
        id: '1',
        title: 'Test Anime',
        status: 'completed',
        current_episode: 12,
        total_episodes: 12,
      }

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null })

      const animeApi = useAnime()
      const result = await animeApi.updateAnime('1', { status: 'completed' })

      expect(result).not.toBe(null)
      expect(result?.status).toBe('completed')
    })
  })

  describe('deleteAnime', () => {
    it('should return false when delete fails', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.delete.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: new Error('Delete failed') })

      const animeApi = useAnime()
      const result = await animeApi.deleteAnime('1')

      expect(result).toBe(false)
    })

    it('should return true when delete succeeds', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.delete.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: null })

      const animeApi = useAnime()
      const result = await animeApi.deleteAnime('1')

      expect(result).toBe(true)
    })
  })
})

