import type { Workout } from '@/composables/useWorkouts'
import { getElapsedTime, getTodayDate } from '@/utils/workout-formatters'

export function useWorkoutsPage() {
  const workoutsApi = useWorkouts()
  const modal = useModal()
  const workoutModal = useModal()
  const detailModal = useModal()

  const currentWorkout = ref<Workout | null>(null)
  const selectedWorkout = ref<Workout | null>(null)
  const loadingDetail = ref(false)
  const newExerciseName = ref('')
  const addingExercise = ref(false)
  const stats = ref({ count: 0, totalMinutes: 0 })
  const elapsedTime = ref('0 min')

  let elapsedInterval: ReturnType<typeof setInterval> | null = null

  const { data: workoutsData, loading, reload: reloadData } = usePageData({
    fetcher: async () => {
      const [workouts, statsResult] = await Promise.all([
        workoutsApi.fetchWorkouts(),
        workoutsApi.getWeeklyStats()
      ])
      stats.value = statsResult
      return workouts.filter(w => w.status === 'completed')
    },
  })

  const workouts = computed(() => workoutsData.value || [])

  async function checkInProgressWorkout() {
    const inProgress = await workoutsApi.getInProgressWorkout()
    if (inProgress) {
      currentWorkout.value = inProgress
      workoutModal.open()
    }
  }

  async function startWorkout(workoutForm: { name: string; description: string; workout_date: string }) {
    if (!workoutForm.name.trim()) return

    const created = await workoutsApi.createWorkout({
      name: workoutForm.name.trim(),
      description: workoutForm.description?.trim() || undefined,
      workout_date: workoutForm.workout_date || getTodayDate(),
      status: 'in_progress',
    })

    if (created) {
      currentWorkout.value = created
      modal.close()
      workoutModal.open()
    }
  }

  async function addExercise() {
    if (!currentWorkout.value || !newExerciseName.value.trim() || addingExercise.value) return

    const exerciseName = newExerciseName.value.trim()
    addingExercise.value = true
    try {
      const exercise = await workoutsApi.addExercise(currentWorkout.value.id, exerciseName)
      if (exercise && currentWorkout.value) {
        currentWorkout.value.exercises.push(exercise)
        newExerciseName.value = ''
      }
    } finally {
      addingExercise.value = false
    }
  }

  async function addSetToExercise(exerciseId: string) {
    if (!currentWorkout.value) return

    const exercise = currentWorkout.value.exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    const newSet = await workoutsApi.addSet(exercise.id, {})
    if (newSet) {
      exercise.sets.push(newSet)
    }
  }

  async function removeSet(exerciseId: string, setId: string) {
    if (!currentWorkout.value) return

    const success = await workoutsApi.deleteSet(setId)
    if (success) {
      const exercise = currentWorkout.value.exercises.find(e => e.id === exerciseId)
      if (exercise) {
        exercise.sets = exercise.sets.filter(s => s.id !== setId)
      }
    }
  }

  async function updateSet(exerciseId: string, setId: string, updates: { reps?: number; weight_kg?: number }) {
    if (!currentWorkout.value) return

    const updatedSet = await workoutsApi.updateSet(setId, {
      reps: updates.reps,
      weight_kg: updates.weight_kg,
    })

    if (updatedSet) {
      const exercise = currentWorkout.value.exercises.find(e => e.id === exerciseId)
      if (exercise) {
        const set = exercise.sets.find(s => s.id === setId)
        if (set) {
          set.reps = updatedSet.reps
          set.weightKg = updatedSet.weightKg
        }
      }
    }
  }

  async function completeWorkout() {
    if (!currentWorkout.value) return

    const startTime = currentWorkout.value.startedAt
    const endTime = new Date()
    const durationMinutes = startTime
      ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
      : undefined

    const success = await workoutsApi.completeWorkout(currentWorkout.value.id, durationMinutes)
    if (success) {
      currentWorkout.value = null
      workoutModal.close()
      await reloadData()
    }
  }

  async function deleteWorkoutEntry(id: string) {
    const workout = workouts.value.find(w => w.id === id)
    const success = await workoutsApi.deleteWorkout(id)
    if (success) {
      await reloadData()
      if (selectedWorkout.value?.id === id) {
        selectedWorkout.value = null
        detailModal.close()
      }
    }
  }

  async function viewWorkoutDetail(workoutId: string) {
    loadingDetail.value = true
    detailModal.open()
    try {
      const workout = await workoutsApi.getWorkoutById(workoutId)
      if (workout) {
        selectedWorkout.value = workout
      }
    } finally {
      loadingDetail.value = false
    }
  }

  function updateElapsedTime() {
    if (currentWorkout.value?.startedAt) {
      elapsedTime.value = getElapsedTime(currentWorkout.value.startedAt)
    }
  }

  watch(() => workoutModal.isOpen.value, (isOpen) => {
    if (isOpen && currentWorkout.value?.startedAt) {
      updateElapsedTime()
      elapsedInterval = setInterval(updateElapsedTime, 1000)
    } else if (elapsedInterval) {
      clearInterval(elapsedInterval)
      elapsedInterval = null
    }
  })

  watch(() => currentWorkout.value?.startedAt, () => {
    if (workoutModal.isOpen.value) {
      updateElapsedTime()
    }
  })

  onUnmounted(() => {
    if (elapsedInterval) {
      clearInterval(elapsedInterval)
    }
  })

  async function initialize() {
    await Promise.all([
      reloadData(),
      checkInProgressWorkout()
    ])
  }

  return {
    workouts: readonly(workouts),
    currentWorkout,
    selectedWorkout: readonly(selectedWorkout),
    loading: readonly(loading),
    loadingDetail: readonly(loadingDetail),
    newExerciseName,
    addingExercise: readonly(addingExercise),
    stats: readonly(stats),
    elapsedTime: readonly(elapsedTime),
    modal,
    workoutModal,
    detailModal,
    startWorkout,
    addExercise,
    addSetToExercise,
    removeSet,
    updateSet,
    completeWorkout,
    deleteWorkoutEntry,
    viewWorkoutDetail,
    initialize,
  }
}

