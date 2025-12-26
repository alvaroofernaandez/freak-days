import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParties } from '../../../app/composables/useParties'
import { useAuthStore } from '../../../stores/auth'

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

vi.mock('../../../app/composables/useSupabase', () => ({
  useSupabase: () => mockSupabase,
}))

vi.mock('../../../app/composables/useToast', () => ({
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
      authStore.setSession(null)

      const partiesApi = useParties()
      const parties = await partiesApi.fetchUserParties()

      expect(parties).toEqual([])
    })

    it('should fetch parties when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

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
      const mockMembers: any[] = []

      const membershipsChain = {
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: mockMemberships, error: null }),
        })),
      }
      const partiesChain = {
        in: vi.fn().mockResolvedValue({ data: mockParties, error: null }),
      }
      const membersChain = {
        eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => membershipsChain),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn(() => partiesChain),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn(() => membersChain),
        } as any)

      const partiesApi = useParties()
      const parties = await partiesApi.fetchUserParties()

      expect(parties).toHaveLength(1)
      expect(parties[0].name).toBe('Test Party')
    })
  })

  describe('createParty', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

      const partiesApi = useParties()
      const result = await partiesApi.createParty('Test Party')

      expect(result).toBe(null)
    })

    it('should create party when valid data is provided', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockData = {
        id: 'party-1',
        name: 'Test Party',
        description: null,
        invite_code: 'ABC123',
        owner_id: 'user-1',
        max_members: 10,
        created_at: new Date().toISOString(),
      }

      const checkCodeChain = {
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      }
      const insertPartyChain = {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      }
      const insertMemberChain = {
        then: vi.fn((callback) => {
          callback({ error: null })
          return Promise.resolve({ error: null })
        }),
      }
      const fetchPartyChain = {
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { ...mockData, party_members: [] }, 
            error: null 
          }),
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => checkCodeChain),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertPartyChain),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertMemberChain),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn(() => fetchPartyChain),
        } as any)

      const partiesApi = useParties()
      const result = await partiesApi.createParty('Test Party')

      expect(result).not.toBe(null)
      expect(result?.name).toBe('Test Party')
    })
  })

  describe('joinByCode', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

      const partiesApi = useParties()
      const result = await partiesApi.joinByCode('ABC123')

      expect(result).toBe(null)
    })

    it('should join party when valid code is provided', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockParty = {
        id: 'party-1',
        name: 'Test Party',
        invite_code: 'ABC123',
      }

      const fullMockParty = {
        ...mockParty,
        description: null,
        owner_id: 'user-1',
        max_members: 10,
        created_at: new Date().toISOString(),
      }

      const findPartyChain = {
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: fullMockParty, error: null }),
        })),
      }
      const checkExistingMemberChain = {
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          })),
        })),
      }
      const countMembersChain = {
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      const insertMemberChain = {
        then: vi.fn((callback) => {
          callback({ error: null })
          return Promise.resolve({ error: null })
        }),
      }
      const fetchPartyChain = {
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { ...fullMockParty, party_members: [] }, 
            error: null 
          }),
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => findPartyChain),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn(() => checkExistingMemberChain),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn(() => countMembersChain),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertMemberChain),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn(() => fetchPartyChain),
        } as any)

      const partiesApi = useParties()
      const result = await partiesApi.joinByCode('ABC123')

      expect(result).not.toBe(null)
      expect(result?.name).toBe('Test Party')
    })
  })
})

