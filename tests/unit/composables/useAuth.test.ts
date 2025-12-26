import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '../../../app/composables/useAuth'
import { useAuthStore } from '../../../stores/auth'

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
}

vi.mock('../../../app/composables/useSupabase', () => ({
  useSupabase: () => mockSupabase,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockSupabase.from.mockImplementation(() => mockSupabase)
    mockSupabase.select.mockImplementation(() => mockSupabase)
    mockSupabase.eq.mockImplementation(() => mockSupabase)
    mockSupabase.single.mockImplementation(() => mockSupabase)
  })

  describe('initialize', () => {
    it('should set loading state during initialization', async () => {
      const authStore = useAuthStore()
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      })

      const auth = useAuth()
      await auth.initialize()

      expect(authStore.loading).toBe(false)
    })

    it('should set session when session exists', async () => {
      const authStore = useAuthStore()
      const mockSession = {
        user: { id: 'user-1', email: 'test@test.com' },
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      })
      const profileChain = {
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      }
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => profileChain),
      } as any)

      const auth = useAuth()
      await auth.initialize()

      expect(authStore.session).toStrictEqual(mockSession)
    })
  })

  describe('signUp', () => {
    it('should return success when signup succeeds', async () => {
      const authStore = useAuthStore()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-1' }, session: null },
        error: null,
      })
      // signUp llama a createProfile directamente, que hace un insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any)

      const auth = useAuth()
      const result = await auth.signUp('test@test.com', 'password123')

      expect(result.success).toBe(true)
    })

    it('should return error when signup fails', async () => {
      const authStore = useAuthStore()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Signup failed' },
      })

      const auth = useAuth()
      const result = await auth.signUp('test@test.com', 'password123')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('signIn', () => {
    it('should return success when signin succeeds', async () => {
      const authStore = useAuthStore()
      const mockSession = {
        user: { id: 'user-1' },
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      })
      const profileChain = {
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null }),
        })),
      }
      const modulesChain = {
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => profileChain),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        } as any)

      const auth = useAuth()
      const result = await auth.signIn('test@test.com', 'password123')

      expect(result.success).toBe(true)
    })

    it('should return error when signin fails', async () => {
      const authStore = useAuthStore()
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      const auth = useAuth()
      const result = await auth.signIn('test@test.com', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const authStore = useAuthStore()
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const auth = useAuth()
      await auth.signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })
})

