import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSupabase } from '~/app/composables/useSupabase'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}))

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-key',
    },
  }),
}))

describe('useSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return Supabase client instance', () => {
    const client = useSupabase()
    expect(client).toBeDefined()
  })

  it('should return same instance on multiple calls', () => {
    const client1 = useSupabase()
    const client2 = useSupabase()
    expect(client1).toBe(client2)
  })

  it('should throw error when URL is missing', () => {
    vi.mocked(useRuntimeConfig).mockReturnValueOnce({
      public: {
        supabaseUrl: '',
        supabaseAnonKey: 'test-key',
      },
    } as any)

    expect(() => useSupabase()).toThrow('Missing Supabase URL or Anon Key')
  })

  it('should throw error when Anon Key is missing', () => {
    vi.mocked(useRuntimeConfig).mockReturnValueOnce({
      public: {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: '',
      },
    } as any)

    expect(() => useSupabase()).toThrow('Missing Supabase URL or Anon Key')
  })
})

