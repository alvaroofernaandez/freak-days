import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProfile } from '~/app/composables/useProfile'
import { useAuthStore } from '~~/stores/auth'

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
}

vi.mock('~/app/composables/useSupabase', () => ({
  useSupabase: () => mockSupabase,
}))

describe('useProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchProfile', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const profileApi = useProfile()
      const profile = await profileApi.fetchProfile()

      expect(profile).toBe(null)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('should fetch profile when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = {
        id: 'user-1',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
        total_exp: 100,
        level: 1,
        bio: null,
        favorite_anime_id: null,
        favorite_manga_id: null,
        location: null,
        website: null,
        social_links: {},
      }

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null })

      const profileApi = useProfile()
      const profile = await profileApi.fetchProfile()

      expect(profile).not.toBe(null)
      expect(profile?.username).toBe('testuser')
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should return null when fetch fails', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Not found') })

      const profileApi = useProfile()
      const profile = await profileApi.fetchProfile()

      expect(profile).toBe(null)
    })
  })

  describe('updateProfile', () => {
    it('should return false when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const profileApi = useProfile()
      const result = await profileApi.updateProfile({ username: 'newuser' })

      expect(result).toBe(false)
    })

    it('should update profile when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: null })

      const profileApi = useProfile()
      const result = await profileApi.updateProfile({ username: 'newuser' })

      expect(result).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalled()
    })
  })

  describe('expForNextLevel', () => {
    it('should calculate exp for next level correctly', () => {
      const profileApi = useProfile()
      
      const result1 = profileApi.expForNextLevel(0)
      expect(result1.current).toBe(0)
      expect(result1.needed).toBe(100)
      expect(result1.progress).toBe(0)

      const result2 = profileApi.expForNextLevel(50)
      expect(result2.current).toBe(50)
      expect(result2.needed).toBe(100)
      expect(result2.progress).toBe(50)

      const result3 = profileApi.expForNextLevel(150)
      expect(result3.current).toBe(50)
      expect(result3.needed).toBe(200)
      expect(result3.progress).toBe(25)
    })
  })
})

