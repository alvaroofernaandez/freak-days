import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkouts } from '~/app/composables/useWorkouts'
import { useAuthStore } from '~~/stores/auth'

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

vi.mock('~/app/composables/useSupabase', () => ({
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
      authStore.userId = null

      const workoutsApi = useWorkouts()
      const workouts = await workoutsApi.fetchWorkouts()

      expect(workouts).toEqual([])
    })

    it('should fetch workouts when user is authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

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

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockResolvedValue({ data: mockData, error: null })

      const workoutsApi = useWorkouts()
      const workouts = await workoutsApi.fetchWorkouts()

      expect(workouts).toHaveLength(1)
      expect(workouts[0].name).toBe('Test Workout')
    })
  })

  describe('createWorkout', () => {
    it('should return null when user is not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.userId = null

      const workoutsApi = useWorkouts()
      const result = await workoutsApi.createWorkout({
        name: 'Test',
        workout_date: new Date().toISOString(),
      })

      expect(result).toBe(null)
    })

    it('should create workout when valid data is provided', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = {
        id: '1',
        name: 'Test Workout',
        workout_date: new Date().toISOString(),
        status: 'in_progress',
        workout_exercises: [],
      }

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null })

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
      authStore.userId = null

      const workoutsApi = useWorkouts()
      const result = await workoutsApi.getInProgressWorkout()

      expect(result).toBe(null)
    })

    it('should return workout when in progress workout exists', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'user-1'

      const mockData = {
        id: '1',
        name: 'In Progress Workout',
        status: 'in_progress',
        workout_exercises: [],
      }

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null })

      const workoutsApi = useWorkouts()
      const result = await workoutsApi.getInProgressWorkout()

      expect(result).not.toBe(null)
      expect(result?.name).toBe('In Progress Workout')
    })
  })
})

