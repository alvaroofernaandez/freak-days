import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useManga } from '~/app/composables/useManga'
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

describe('useManga', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchCollection', () => {
    it('should return empty array when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const mangaApi = useManga()
      const collection = await mangaApi.fetchCollection()

      expect(collection).toEqual([])
    })

    it('should fetch collection when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = [
        {
          id: '1',
          title: 'Test Manga',
          author: 'Test Author',
          total_volumes: 10,
          owned_volumes: [1, 2, 3],
          status: 'collecting',
          score: null,
          notes: null,
          cover_url: null,
          price_per_volume: 10.5,
          total_cost: 31.5,
        },
      ]

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({ data: mockData, error: null })

      const mangaApi = useManga()
      const collection = await mangaApi.fetchCollection()

      expect(collection).toHaveLength(1)
      expect(collection[0].title).toBe('Test Manga')
    })
  })

  describe('addManga', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const mangaApi = useManga()
      const result = await mangaApi.addManga({ title: 'Test' })

      expect(result).toBe(null)
    })

    it('should add manga when valid data is provided', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = {
        id: '1',
        title: 'Test Manga',
        author: 'Test Author',
        total_volumes: 10,
        owned_volumes: [],
        status: 'collecting',
        score: null,
        notes: null,
        cover_url: null,
        price_per_volume: 10.5,
        total_cost: 0,
      }

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null })

      const mangaApi = useManga()
      const result = await mangaApi.addManga({
        title: 'Test Manga',
        author: 'Test Author',
      })

      expect(result).not.toBe(null)
      expect(result?.title).toBe('Test Manga')
    })
  })

  describe('addVolume', () => {
    it('should return false when manga does not exist', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const mangaApi = useManga()
      const result = await mangaApi.addVolume('non-existent', 1)

      expect(result).toBe(false)
    })

    it('should add volume when manga exists', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockManga = {
        id: '1',
        owned_volumes: [1, 2],
        price_per_volume: 10.5,
        total_cost: 21,
      }

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockManga, error: null })
        .mockResolvedValueOnce({ data: { ...mockManga, owned_volumes: [1, 2, 3] }, error: null })

      mockSupabase.update.mockReturnValue(mockSupabase)

      const mangaApi = useManga()
      const result = await mangaApi.addVolume('1', 3)

      expect(result).toBe(true)
    })
  })
})

