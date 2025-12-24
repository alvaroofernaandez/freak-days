<script setup lang="ts">
import { Dumbbell, Plus, Flame, Trash2, X, Clock, Check, Play, Minus, TrendingUp, Activity, BarChart3, Eye } from 'lucide-vue-next'
import type { Workout, WorkoutExercise, WorkoutSet } from '../composables/useWorkouts'

const workoutsApi = useWorkouts()

const workouts = ref<Workout[]>([])
const currentWorkout = ref<Workout | null>(null)
const selectedWorkout = ref<Workout | null>(null)
const loading = ref(true)
const showAddModal = ref(false)
const showWorkoutModal = ref(false)
const showDetailModal = ref(false)
const loadingDetail = ref(false)

const getTodayDate = () => new Date().toISOString().split('T')[0] || ''

const newWorkout = ref<{
  name: string
  description: string
  workout_date: string
}>({
  name: '',
  description: '',
  workout_date: getTodayDate(),
})

const newExerciseName = ref('')
const addingExercise = ref(false)

const stats = ref({ count: 0, totalMinutes: 0 })

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

async function startWorkout() {
  if (!newWorkout.value.name.trim()) return

  const created = await workoutsApi.createWorkout({
    name: newWorkout.value.name.trim(),
    description: newWorkout.value.description?.trim() || undefined,
    workout_date: newWorkout.value.workout_date || getTodayDate(),
    status: 'in_progress',
  })

  if (created) {
    currentWorkout.value = created
    showAddModal.value = false
    showWorkoutModal.value = true
    newWorkout.value.name = ''
    newWorkout.value.description = ''
    newWorkout.value.workout_date = getTodayDate()
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

async function addSetToExercise(exercise: WorkoutExercise) {
  if (!currentWorkout.value) return

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

function calculateWorkoutStats(workout: Workout) {
  const totalExercises = workout.exercises.length
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const totalReps = workout.exercises.reduce((sum, ex) => 
    sum + ex.sets.reduce((s, set) => s + (set.reps ?? 0), 0), 0
  )
  const totalVolume = workout.exercises.reduce((sum, ex) => 
    sum + ex.sets.reduce((s, set) => s + ((set.reps ?? 0) * (set.weightKg ?? 0)), 0), 0
  )
  const avgWeight = totalSets > 0 
    ? workout.exercises.reduce((sum, ex) => 
        sum + ex.sets.reduce((s, set) => s + (set.weightKg ?? 0), 0), 0
      ) / totalSets
    : 0

  return {
    totalExercises,
    totalSets,
    totalReps,
    totalVolume,
    avgWeight: Math.round(avgWeight * 10) / 10,
  }
}

function formatDate(date: Date) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return 'Hoy'
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDuration(minutes: number | null) {
  if (!minutes) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

function getElapsedTime(startTime: Date | null) {
  if (!startTime) return '0 min'
  const elapsed = Math.round((new Date().getTime() - startTime.getTime()) / 60000)
  return formatDuration(elapsed)
}

const elapsedTime = ref('0 min')

let elapsedInterval: ReturnType<typeof setInterval> | null = null

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

    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <Card class="text-center py-3 sm:py-4">
        <div class="text-xl sm:text-2xl font-bold text-primary">{{ stats.count }}</div>
        <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Esta semana</div>
      </Card>
      <Card class="text-center py-3 sm:py-4">
        <div class="text-xl sm:text-2xl font-bold text-exp-hard flex items-center justify-center gap-1">
          <Flame class="h-4 w-4 sm:h-5 sm:w-5" />
          {{ workouts.length }}
        </div>
        <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Total</div>
      </Card>
      <Card class="text-center py-3 sm:py-4">
        <div class="text-xl sm:text-2xl font-bold text-exp-easy">{{ stats.totalMinutes }}</div>
        <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Min. semana</div>
      </Card>
    </div>

    <section class="space-y-3">
      <h2 class="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
        Historial Reciente
      </h2>
      
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
      
      <div v-else-if="workouts.length === 0" class="text-center py-12 sm:py-16">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Dumbbell class="h-8 w-8 sm:h-10 sm:w-10 text-primary/50" />
          </div>
          <div class="space-y-2">
            <p class="text-muted-foreground text-sm sm:text-base font-medium">No hay entrenamientos registrados</p>
            <p class="text-muted-foreground/70 text-xs sm:text-sm">Comienza tu primer entrenamiento</p>
          </div>
          <Button variant="outline" size="lg" class="mt-2" @click="showAddModal = true">
            <Plus class="h-4 w-4 mr-2" />
            Iniciar entrenamiento
          </Button>
        </div>
      </div>

      <div v-else class="space-y-2 sm:space-y-3">
        <Card 
          v-for="workout in workouts" 
          :key="workout.id" 
          class="hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer group"
          @click="viewWorkoutDetail(workout.id)"
        >
          <CardHeader class="flex flex-row items-center gap-3 py-3 sm:py-4 px-3 sm:px-4">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Dumbbell class="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <CardTitle class="text-sm sm:text-base font-medium truncate group-hover:text-primary transition-colors">
                {{ workout.name }}
              </CardTitle>
              <CardDescription class="text-xs sm:text-sm mt-0.5">
                {{ workout.exercises.length }} ejercicios · {{ formatDuration(workout.durationMinutes) }}
              </CardDescription>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                @click.stop="viewWorkoutDetail(workout.id)"
              >
                <Eye class="h-4 w-4" />
              </Button>
              <Badge variant="outline" class="text-[10px] sm:text-xs hidden sm:inline-flex">
                {{ formatDate(workout.workoutDate) }}
              </Badge>
              <span class="text-[10px] sm:text-xs text-muted-foreground sm:hidden">
                {{ formatDate(workout.workoutDate) }}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                @click.stop="deleteWorkoutEntry(workout.id)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </section>

    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <Card class="w-full max-w-md my-auto shadow-xl border-2">
        <CardHeader class="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b">
          <CardTitle class="text-lg sm:text-xl">Nuevo Entrenamiento</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            class="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted hover:text-foreground cursor-pointer" 
            @click="showAddModal = false"
          >
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4 pt-4 sm:pt-6">
          <div class="space-y-2">
            <Label for="name" class="text-sm font-medium">Nombre del entrenamiento</Label>
            <Input 
              id="name" 
              v-model="newWorkout.name" 
              placeholder="Ej: Push Day, Pierna, Full Body..." 
              class="w-full h-11 text-base"
              autofocus
            />
          </div>
          
          <div class="space-y-2">
            <Label for="date" class="text-sm font-medium">Fecha</Label>
            <Input 
              id="date" 
              v-model="newWorkout.workout_date" 
              type="date" 
              class="w-full h-11 text-base"
            />
          </div>

          <div class="space-y-2">
            <Label for="description" class="text-sm font-medium">Notas (opcional)</Label>
            <Input 
              id="description" 
              v-model="newWorkout.description" 
              placeholder="Notas sobre el entrenamiento..." 
              class="w-full h-11 text-base"
            />
          </div>

          <Button 
            size="lg" 
            class="w-full h-12 text-base font-semibold mt-2" 
            @click="startWorkout" 
            :disabled="!newWorkout.name.trim()"
          >
            <Play class="h-5 w-5 mr-2" />
            Iniciar Entrenamiento
          </Button>
        </CardContent>
      </Card>
    </div>

    <div v-if="showWorkoutModal && currentWorkout" class="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      <div class="flex-1 overflow-y-auto">
        <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div class="max-w-2xl mx-auto px-4 py-3 sm:py-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <CardTitle class="text-base sm:text-lg font-bold truncate flex items-center gap-2">
                    {{ currentWorkout.name }}
                  </CardTitle>
                </div>
                <CardDescription class="text-xs sm:text-sm flex items-center gap-1.5">
                  <Clock class="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{{ elapsedTime }}</span>
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-9 w-9 sm:h-10 sm:w-10 hover:bg-muted hover:text-foreground cursor-pointer shrink-0" 
                @click="showWorkoutModal = false"
              >
                <X class="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div class="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <div v-if="currentWorkout.exercises.length === 0" class="text-center py-12 sm:py-16">
            <div class="flex flex-col items-center gap-4">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Dumbbell class="h-8 w-8 sm:h-10 sm:w-10 text-primary/50" />
              </div>
              <div class="space-y-2">
                <p class="text-muted-foreground text-sm sm:text-base font-medium">No hay ejercicios añadidos</p>
                <p class="text-muted-foreground/70 text-xs sm:text-sm">Añade tu primer ejercicio abajo</p>
              </div>
            </div>
          </div>

          <div v-else class="space-y-3 sm:space-y-4">
            <div 
              v-for="exercise in currentWorkout.exercises" 
              :key="exercise.id" 
              class="space-y-3 p-4 sm:p-5 border rounded-xl bg-card/50"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-base sm:text-lg mb-1">{{ exercise.exerciseName }}</h3>
                  <p v-if="exercise.sets.length > 0" class="text-xs sm:text-sm text-muted-foreground">
                    {{ exercise.sets.length }} {{ exercise.sets.length === 1 ? 'serie' : 'series' }}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  class="h-9 sm:h-10 px-3 sm:px-4 hover:bg-primary/10 hover:text-primary cursor-pointer shrink-0" 
                  @click="addSetToExercise(exercise)"
                >
                  <Plus class="h-4 w-4 mr-1.5" />
                  <span class="text-xs sm:text-sm">Serie</span>
                </Button>
              </div>

              <div v-if="exercise.sets.length === 0" class="text-center py-6 sm:py-8 border-2 border-dashed rounded-lg bg-muted/30">
                <p class="text-sm text-muted-foreground">No hay series registradas</p>
                <p class="text-xs text-muted-foreground/70 mt-1">Añade tu primera serie</p>
              </div>

              <div v-else class="space-y-2">
                <div 
                  v-for="set in exercise.sets" 
                  :key="set.id" 
                  class="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 shrink-0">
                    <span class="text-xs sm:text-sm font-bold text-primary">{{ set.setNumber }}</span>
                  </div>
                  
                  <div class="flex-1 grid grid-cols-2 gap-2 sm:gap-3">
                    <div class="space-y-1">
                      <Label class="text-[10px] sm:text-xs text-muted-foreground">Reps</Label>
                      <Input
                        :model-value="set.reps ?? ''"
                        type="number"
                        placeholder="0"
                        class="h-10 sm:h-11 text-base font-medium text-center"
                        @update:model-value="(val) => { set.reps = val ? Number(val) : null }"
                        @blur="updateSet(exercise.id, set.id, { reps: set.reps ?? undefined, weight_kg: set.weightKg ?? undefined })"
                      />
                    </div>
                    <div class="space-y-1">
                      <Label class="text-[10px] sm:text-xs text-muted-foreground">Kg</Label>
                      <Input
                        :model-value="set.weightKg ?? ''"
                        type="number"
                        step="0.5"
                        placeholder="0"
                        class="h-10 sm:h-11 text-base font-medium text-center"
                        @update:model-value="(val) => { set.weightKg = val ? Number(val) : null }"
                        @blur="updateSet(exercise.id, set.id, { reps: set.reps ?? undefined, weight_kg: set.weightKg ?? undefined })"
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                    @click="removeSet(exercise.id, set.id)"
                  >
                    <Minus class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div class="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-4 pb-4 sm:pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div class="space-y-3">
              <div class="flex gap-2">
                <Input 
                  v-model="newExerciseName" 
                  placeholder="Nombre del ejercicio" 
                  class="flex-1 h-11 sm:h-12 text-base"
                  @keyup.enter="addExercise"
                />
                <Button 
                  size="lg"
                  class="h-11 sm:h-12 px-6 shrink-0" 
                  @click="addExercise" 
                  :disabled="!newExerciseName.trim() || addingExercise"
                >
                  <Plus class="h-5 w-5 mr-2" />
                  <span class="hidden sm:inline">Añadir</span>
                </Button>
              </div>
              
              <Button 
                size="lg"
                class="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold" 
                @click="completeWorkout"
              >
                <Check class="h-5 w-5 mr-2" />
                Finalizar Entrenamiento
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal && selectedWorkout" class="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      <div class="flex-1 overflow-y-auto">
        <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div class="max-w-3xl mx-auto px-4 py-3 sm:py-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <CardTitle class="text-lg sm:text-xl font-bold truncate flex items-center gap-2">
                  <Dumbbell class="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  {{ selectedWorkout.name }}
                </CardTitle>
                <CardDescription class="text-xs sm:text-sm mt-1 flex items-center gap-3 flex-wrap">
                  <span class="flex items-center gap-1.5">
                    <Clock class="h-3 w-3 sm:h-4 sm:w-4" />
                    {{ formatDate(selectedWorkout.workoutDate) }} · {{ formatDuration(selectedWorkout.durationMinutes) }}
                  </span>
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-9 w-9 sm:h-10 sm:w-10 hover:bg-muted hover:text-foreground cursor-pointer shrink-0" 
                @click="showDetailModal = false"
              >
                <X class="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div v-if="loadingDetail" class="flex items-center justify-center py-16">
          <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>

        <div v-else class="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <div v-if="selectedWorkout.description" class="p-3 sm:p-4 bg-muted/30 rounded-lg border">
            <p class="text-sm sm:text-base text-muted-foreground">{{ selectedWorkout.description }}</p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card class="p-3 sm:p-4 text-center">
              <div class="flex items-center justify-center mb-2">
                <Activity class="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div class="text-lg sm:text-2xl font-bold text-primary">{{ calculateWorkoutStats(selectedWorkout).totalExercises }}</div>
              <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Ejercicios</div>
            </Card>
            <Card class="p-3 sm:p-4 text-center">
              <div class="flex items-center justify-center mb-2">
                <BarChart3 class="h-4 w-4 sm:h-5 sm:w-5 text-exp-medium" />
              </div>
              <div class="text-lg sm:text-2xl font-bold text-exp-medium">{{ calculateWorkoutStats(selectedWorkout).totalSets }}</div>
              <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Series</div>
            </Card>
            <Card class="p-3 sm:p-4 text-center">
              <div class="flex items-center justify-center mb-2">
                <TrendingUp class="h-4 w-4 sm:h-5 sm:w-5 text-exp-hard" />
              </div>
              <div class="text-lg sm:text-2xl font-bold text-exp-hard">{{ calculateWorkoutStats(selectedWorkout).totalReps }}</div>
              <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Repeticiones</div>
            </Card>
            <Card class="p-3 sm:p-4 text-center">
              <div class="flex items-center justify-center mb-2">
                <Flame class="h-4 w-4 sm:h-5 sm:w-5 text-exp-legendary" />
              </div>
              <div class="text-lg sm:text-2xl font-bold text-exp-legendary">{{ calculateWorkoutStats(selectedWorkout).totalVolume }} kg</div>
              <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Volumen total</div>
            </Card>
          </div>

          <div v-if="selectedWorkout.exercises.length === 0" class="text-center py-12 sm:py-16">
            <div class="flex flex-col items-center gap-4">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Dumbbell class="h-8 w-8 sm:h-10 sm:w-10 text-primary/50" />
              </div>
              <div class="space-y-2">
                <p class="text-muted-foreground text-sm sm:text-base font-medium">No hay ejercicios registrados</p>
              </div>
            </div>
          </div>

          <div v-else class="space-y-3 sm:space-y-4">
            <h3 class="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-wider">
              Ejercicios
            </h3>
            <div 
              v-for="exercise in selectedWorkout.exercises" 
              :key="exercise.id" 
              class="space-y-3 p-4 sm:p-5 border rounded-xl bg-card/50"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-base sm:text-lg mb-1">{{ exercise.exerciseName }}</h4>
                  <p v-if="exercise.sets.length > 0" class="text-xs sm:text-sm text-muted-foreground">
                    {{ exercise.sets.length }} {{ exercise.sets.length === 1 ? 'serie' : 'series' }}
                    <span v-if="calculateWorkoutStats(selectedWorkout).totalVolume > 0">
                      · Volumen: {{ exercise.sets.reduce((sum, set) => sum + ((set.reps ?? 0) * (set.weightKg ?? 0)), 0) }} kg
                    </span>
                  </p>
                </div>
              </div>

              <div v-if="exercise.sets.length === 0" class="text-center py-4 border-2 border-dashed rounded-lg bg-muted/30">
                <p class="text-sm text-muted-foreground">No hay series registradas</p>
              </div>

              <div v-else class="space-y-2">
                <div class="grid grid-cols-4 gap-2 text-xs sm:text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div class="text-center">Serie</div>
                  <div class="text-center">Reps</div>
                  <div class="text-center">Peso (kg)</div>
                  <div class="text-center">Volumen</div>
                </div>
                <div 
                  v-for="set in exercise.sets" 
                  :key="set.id" 
                  class="grid grid-cols-4 gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg"
                >
                  <div class="flex items-center justify-center">
                    <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span class="text-xs sm:text-sm font-bold text-primary">{{ set.setNumber }}</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-center text-sm sm:text-base font-medium">
                    {{ set.reps ?? '-' }}
                  </div>
                  <div class="flex items-center justify-center text-sm sm:text-base font-medium">
                    {{ set.weightKg ?? '-' }}
                  </div>
                  <div class="flex items-center justify-center text-sm sm:text-base font-semibold text-primary">
                    {{ (set.reps ?? 0) * (set.weightKg ?? 0) || '-' }}
                  </div>
                </div>
                <div class="grid grid-cols-4 gap-2 p-2 sm:p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div class="flex items-center justify-center text-xs sm:text-sm font-semibold text-muted-foreground">
                    Total
                  </div>
                  <div class="flex items-center justify-center text-sm sm:text-base font-bold">
                    {{ exercise.sets.reduce((sum, set) => sum + (set.reps ?? 0), 0) }}
                  </div>
                  <div class="flex items-center justify-center text-sm sm:text-base font-bold">
                    {{ exercise.sets.length > 0 ? (exercise.sets.reduce((sum, set) => sum + (set.weightKg ?? 0), 0) / exercise.sets.length).toFixed(1) : '-' }}
                  </div>
                  <div class="flex items-center justify-center text-sm sm:text-base font-bold text-primary">
                    {{ exercise.sets.reduce((sum, set) => sum + ((set.reps ?? 0) * (set.weightKg ?? 0)), 0) }} kg
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
