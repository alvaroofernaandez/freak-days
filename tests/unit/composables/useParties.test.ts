import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParties } from '~/app/composables/useParties'
import { useAuthStore } from '~~/stores/auth'

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
}

vi.mock('~/app/composables/useSupabase', () => ({
  useSupabase: () => mockSupabase,
}))

vi.mock('~/app/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('useParties', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchUserParties', () => {
    it('should return empty array when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const partiesApi = useParties()
      const parties = await partiesApi.fetchUserParties()

      expect(parties).toEqual([])
    })

    it('should fetch parties when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockMemberships = [{ party_id: 'party-1' }]
      const mockParties = [
        {
          id: 'party-1',
          name: 'Test Party',
          description: null,
          invite_code: 'ABC123',
          owner_id: 'user-1',
          max_members: 10,
          created_at: new Date().toISOString(),
        },
      ]
      const mockMembers = []

      mockSupabase.from
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)

      mockSupabase.select
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)

      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)

      mockSupabase.order.mockReturnValueOnce(mockSupabase)
      mockSupabase.in.mockResolvedValueOnce({ data: mockParties, error: null })

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockMemberships, error: null })
        .mockResolvedValueOnce({ data: mockMembers, error: null })

      const partiesApi = useParties()
      const parties = await partiesApi.fetchUserParties()

      expect(parties).toHaveLength(1)
      expect(parties[0].name).toBe('Test Party')
    })
  })

  describe('createParty', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const partiesApi = useParties()
      const result = await partiesApi.createParty('Test Party')

      expect(result).toBe(null)
    })

    it('should create party when valid data is provided', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = {
        id: 'party-1',
        name: 'Test Party',
        description: null,
        invite_code: 'ABC123',
        owner_id: 'user-1',
        max_members: 10,
        created_at: new Date().toISOString(),
      }

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null })

      const partiesApi = useParties()
      const result = await partiesApi.createParty('Test Party')

      expect(result).not.toBe(null)
      expect(result?.name).toBe('Test Party')
    })
  })

  describe('joinByCode', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const partiesApi = useParties()
      const result = await partiesApi.joinByCode('ABC123')

      expect(result).toBe(null)
    })

    it('should join party when valid code is provided', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockParty = {
        id: 'party-1',
        name: 'Test Party',
        invite_code: 'ABC123',
      }

      mockSupabase.from
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)

      mockSupabase.select
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)

      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockParty, error: null })
        .mockResolvedValueOnce({ data: { id: 'member-1' }, error: null })

      mockSupabase.insert.mockResolvedValue({ error: null })

      const partiesApi = useParties()
      const result = await partiesApi.joinByCode('ABC123')

      expect(result).not.toBe(null)
      expect(result?.name).toBe('Test Party')
    })
  })
})

