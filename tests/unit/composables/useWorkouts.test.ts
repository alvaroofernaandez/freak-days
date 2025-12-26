import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkouts } from '../../../app/composables/useWorkouts'
import { useAuthStore } from '../../../stores/auth'

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
}

vi.mock('../../../app/composables/useSupabase', () => ({
  useSupabase: () => mockSupabase,
}))

describe('useWorkouts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchWorkouts', () => {
    it('should return empty array when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

      const workoutsApi = useWorkouts()
      const workouts = await workoutsApi.fetchWorkouts()

      expect(workouts).toEqual([])
    })

    it('should fetch workouts when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockData = [
        {
          id: '1',
          name: 'Test Workout',
          description: null,
          workout_date: new Date().toISOString(),
          duration_minutes: 60,
          notes: null,
          status: 'completed',
          started_at: null,
          completed_at: null,
          workout_exercises: [],
        },
      ]

      const queryChain = {
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          })),
        })),
      }
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(queryChain as any)

      const workoutsApi = useWorkouts()
      const workouts = await workoutsApi.fetchWorkouts()

      expect(workouts).toHaveLength(1)
      expect(workouts[0].name).toBe('Test Workout')
    })
  })

  describe('createWorkout', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

      const workoutsApi = useWorkouts()
      const result = await workoutsApi.createWorkout({
        name: 'Test',
        workout_date: new Date().toISOString(),
      })

      expect(result).toBe(null)
    })

    it('should create workout when valid data is provided', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockData = {
        id: '1',
        name: 'Test Workout',
        workout_date: new Date().toISOString(),
        status: 'in_progress',
        description: null,
        duration_minutes: null,
        notes: null,
        started_at: new Date().toISOString(),
        completed_at: null,
        workout_exercises: [],
      }

      const insertChain = {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      }
      const getWorkoutChain = {
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      }
      mockSupabase.from
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn(() => getWorkoutChain),
        } as any)

      const workoutsApi = useWorkouts()
      const result = await workoutsApi.createWorkout({
        name: 'Test Workout',
        workout_date: new Date().toISOString(),
      })

      expect(result).not.toBe(null)
      expect(result?.name).toBe('Test Workout')
    })
  })

  describe('getInProgressWorkout', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.setSession(null)

      const workoutsApi = useWorkouts()
      const result = await workoutsApi.getInProgressWorkout()

      expect(result).toBe(null)
    })

    it('should return workout when in progress workout exists', async () => {
      const authStore = useAuthStore()
      authStore.setSession({ user: { id: 'user-1' }, access_token: '', refresh_token: '', expires_in: 3600, expires_at: 0, token_type: 'bearer' } as any)

      const mockData = {
        id: '1',
        name: 'In Progress Workout',
        status: 'in_progress',
        workout_exercises: [],
      }

      const queryChain = {
        eq: vi.fn()
          .mockReturnValueOnce({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
                })),
              })),
            })),
          }),
      }
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(queryChain as any)

      const workoutsApi = useWorkouts()
      const result = await workoutsApi.getInProgressWorkout()

      expect(result).not.toBe(null)
      expect(result?.name).toBe('In Progress Workout')
    })
  })
})

