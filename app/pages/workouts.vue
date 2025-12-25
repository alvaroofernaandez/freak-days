<script setup lang="ts">
import { Dumbbell, Plus, Play } from 'lucide-vue-next'
import type { Workout, WorkoutExercise } from '@/composables/useWorkouts'
import { getElapsedTime, getTodayDate } from '@/utils/workout-formatters'
import WorkoutStats from '@/components/workouts/WorkoutStats.vue'
import WorkoutStatsSkeleton from '@/components/workouts/WorkoutStatsSkeleton.vue'
import WorkoutList from '@/components/workouts/WorkoutList.vue'
import StartWorkoutModal from '@/components/workouts/StartWorkoutModal.vue'
import ActiveWorkoutModal from '@/components/workouts/ActiveWorkoutModal.vue'
import WorkoutDetailModal from '@/components/workouts/WorkoutDetailModal.vue'

const workoutsApi = useWorkouts()

const workouts = ref<Workout[]>([])
const currentWorkout = ref<Workout | null>(null)
const selectedWorkout = ref<Workout | null>(null)
const loading = ref(true)
const showAddModal = ref(false)
const showWorkoutModal = ref(false)
const showDetailModal = ref(false)
const loadingDetail = ref(false)
const newExerciseName = ref('')
const addingExercise = ref(false)
const stats = ref({ count: 0, totalMinutes: 0 })
const elapsedTime = ref('0 min')

let elapsedInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadData()
  await checkInProgressWorkout()
})

async function loadData() {
  loading.value = true
  try {
    const [workoutsData, statsData] = await Promise.all([
      workoutsApi.fetchWorkouts(),
      workoutsApi.getWeeklyStats()
    ])
    workouts.value = workoutsData.filter(w => w.status === 'completed')
    stats.value = statsData
  } finally {
    loading.value = false
  }
}

async function checkInProgressWorkout() {
  const inProgress = await workoutsApi.getInProgressWorkout()
  if (inProgress) {
    currentWorkout.value = inProgress
    showWorkoutModal.value = true
  }
}

function handleStartWorkout(workoutForm: { name: string; description: string; workout_date: string }) {
  startWorkout(workoutForm)
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
    showAddModal.value = false
    showWorkoutModal.value = true
  }
}

async function addExercise() {
  if (!currentWorkout.value || !newExerciseName.value.trim() || addingExercise.value) return

  const exerciseName = newExerciseName.value.trim()
  if (!exerciseName) return

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

  const { error } = await useSupabase()
    .from('workout_sets')
    .delete()
    .eq('id', setId)

  if (!error) {
    const exercise = currentWorkout.value.exercises.find(e => e.id === exerciseId)
    if (exercise) {
      exercise.sets = exercise.sets.filter(s => s.id !== setId)
    }
  }
}

async function updateSet(exerciseId: string, setId: string, updates: { reps?: number; weight_kg?: number }) {
  if (!currentWorkout.value) return

  const { error } = await useSupabase()
    .from('workout_sets')
    .update({
      reps: updates.reps,
      weight_kg: updates.weight_kg,
    })
    .eq('id', setId)

  if (!error) {
    const exercise = currentWorkout.value.exercises.find(e => e.id === exerciseId)
    if (exercise) {
      const set = exercise.sets.find(s => s.id === setId)
      if (set) {
        set.reps = updates.reps ?? set.reps
        set.weightKg = updates.weight_kg ?? set.weightKg
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
    showWorkoutModal.value = false
    await loadData()
  }
}

async function deleteWorkoutEntry(id: string) {
  const workout = workouts.value.find(w => w.id === id)
  const success = await workoutsApi.deleteWorkout(id)
  if (success) {
    workouts.value = workouts.value.filter(w => w.id !== id)
    if (workout) {
      stats.value.count = Math.max(0, stats.value.count - 1)
      stats.value.totalMinutes = Math.max(0, stats.value.totalMinutes - (workout.durationMinutes ?? 0))
    }
    if (selectedWorkout.value?.id === id) {
      selectedWorkout.value = null
      showDetailModal.value = false
    }
  }
}

async function viewWorkoutDetail(workoutId: string) {
  loadingDetail.value = true
  showDetailModal.value = true
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

watch(() => showWorkoutModal, (isOpen) => {
  if (isOpen && currentWorkout.value?.startedAt) {
    updateElapsedTime()
    elapsedInterval = setInterval(updateElapsedTime, 1000)
  } else if (elapsedInterval) {
    clearInterval(elapsedInterval)
    elapsedInterval = null
  }
})

watch(() => currentWorkout.value?.startedAt, () => {
  if (showWorkoutModal.value) {
    updateElapsedTime()
  }
})

onUnmounted(() => {
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
  }
})
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Dumbbell class="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Entrenamientos
        </h1>
        <p class="text-muted-foreground text-xs sm:text-sm mt-0.5">
          Registra tu progreso en el gym
        </p>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Button 
          v-if="!currentWorkout"
          size="lg"
          class="flex-1 sm:flex-none sm:h-10 sm:w-auto rounded-full glow-primary" 
          @click="showAddModal = true"
        >
          <Plus class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          <span class="sm:hidden">Nuevo</span>
          <span class="hidden sm:inline">Nuevo Entrenamiento</span>
        </Button>
        <Button 
          v-else
          variant="outline"
          size="lg"
          class="flex-1 sm:flex-none gap-2"
          @click="showWorkoutModal = true"
        >
          <Play class="h-4 w-4" />
          <span class="sm:hidden">En curso</span>
          <span class="hidden sm:inline">Entrenamiento en curso</span>
        </Button>
      </div>
    </header>

    <WorkoutStatsSkeleton v-if="loading" />
    <WorkoutStats 
      v-else
      :weekly-count="stats.count"
      :total-count="workouts.length"
      :weekly-minutes="stats.totalMinutes"
    />

    <WorkoutList
      :workouts="workouts"
      :loading="loading"
      @view="viewWorkoutDetail"
      @delete="deleteWorkoutEntry"
      @add="showAddModal = true"
    />

    <StartWorkoutModal
      :open="showAddModal"
      @close="showAddModal = false"
      @start="handleStartWorkout"
    />

    <ActiveWorkoutModal
      v-if="currentWorkout"
      :workout="currentWorkout"
      :elapsed-time="elapsedTime"
      v-model:new-exercise-name="newExerciseName"
      :adding-exercise="addingExercise"
      @close="showWorkoutModal = false"
      @add-exercise="addExercise"
      @add-set="addSetToExercise"
      @update-set="updateSet"
      @remove-set="removeSet"
      @complete="completeWorkout"
    />

    <WorkoutDetailModal
      :workout="selectedWorkout"
      :loading="loadingDetail"
      @close="showDetailModal = false"
    />
  </div>
</template>
