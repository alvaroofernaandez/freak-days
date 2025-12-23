<script setup lang="ts">
import { Dumbbell, Plus, Flame, Calendar, Trash2, X, Clock, Check, Play, Square } from 'lucide-vue-next'
import type { Workout, WorkoutExercise, WorkoutSet } from '../composables/useWorkouts'

const workoutsApi = useWorkouts()

const workouts = ref<Workout[]>([])
const currentWorkout = ref<Workout | null>(null)
const loading = ref(true)
const showAddModal = ref(false)
const showWorkoutModal = ref(false)

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
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Dumbbell class="h-6 w-6 text-primary" />
          Entrenamientos
        </h1>
        <p class="text-muted-foreground text-sm">
          Registra tu progreso en el gym
        </p>
      </div>
      <Button 
        v-if="!currentWorkout"
        size="icon" 
        class="h-10 w-10 rounded-full glow-primary" 
        @click="showAddModal = true"
      >
        <Plus class="h-5 w-5" />
      </Button>
      <Button 
        v-else
        variant="outline"
        class="gap-2"
        @click="showWorkoutModal = true"
      >
        <Play class="h-4 w-4" />
        Entrenamiento en curso
      </Button>
    </header>

    <div class="grid grid-cols-3 gap-3">
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-primary">{{ stats.count }}</div>
        <div class="text-xs text-muted-foreground">Esta semana</div>
      </Card>
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-exp-hard flex items-center justify-center gap-1">
          <Flame class="h-5 w-5" />
          {{ workouts.length }}
        </div>
        <div class="text-xs text-muted-foreground">Total</div>
      </Card>
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-exp-easy">{{ stats.totalMinutes }}</div>
        <div class="text-xs text-muted-foreground">Min. semana</div>
      </Card>
    </div>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Historial Reciente
      </h2>
      
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
      
      <Card v-for="workout in workouts" :key="workout.id" class="hover:border-primary/30 transition-colors">
        <CardHeader class="flex flex-row items-center gap-3 py-3 px-4">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Dumbbell class="h-5 w-5 text-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <CardTitle class="text-sm font-medium">{{ workout.name }}</CardTitle>
            <CardDescription class="text-xs">
              {{ workout.exercises.length }} ejercicios · {{ formatDuration(workout.durationMinutes) }}
            </CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs">
              {{ formatDate(workout.workoutDate) }}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              @click="deleteWorkoutEntry(workout.id)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div v-if="!loading && workouts.length === 0" class="text-center py-8">
        <Dumbbell class="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
        <p class="text-muted-foreground text-sm">No hay entrenamientos registrados</p>
        <Button variant="outline" size="sm" class="mt-4" @click="showAddModal = true">
          <Plus class="h-4 w-4 mr-2" />
          Iniciar entrenamiento
        </Button>
      </div>
    </section>

    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <Card class="w-full max-w-md my-8">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Nuevo Entrenamiento</CardTitle>
          <Button variant="ghost" size="icon" class="hover:bg-muted hover:text-foreground cursor-pointer" @click="showAddModal = false">
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Nombre</Label>
            <Input id="name" v-model="newWorkout.name" placeholder="Ej: Push Day" class="w-full" />
          </div>
          
          <div class="space-y-2">
            <Label for="date">Fecha</Label>
            <Input id="date" v-model="newWorkout.workout_date" type="date" class="w-full" />
          </div>

          <div class="space-y-2">
            <Label for="description">Descripción (opcional)</Label>
            <Input id="description" v-model="newWorkout.description" placeholder="Notas sobre el entrenamiento" class="w-full" />
          </div>

          <Button class="w-full" @click="startWorkout" :disabled="!newWorkout.name.trim()">
            <Play class="h-4 w-4 mr-2" />
            Iniciar Entrenamiento
          </Button>
        </CardContent>
      </Card>
    </div>

    <div v-if="showWorkoutModal && currentWorkout" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <Card class="w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
        <CardHeader class="flex flex-row items-center justify-between border-b">
          <div class="flex-1">
            <CardTitle class="flex items-center gap-2">
              <Play class="h-5 w-5 text-primary" />
              {{ currentWorkout.name }}
            </CardTitle>
            <CardDescription class="mt-1">
              <Clock class="h-3 w-3 inline mr-1" />
              {{ currentWorkout.startedAt ? formatDuration(Math.round((new Date().getTime() - currentWorkout.startedAt.getTime()) / 60000)) : '0 min' }}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" class="hover:bg-muted hover:text-foreground cursor-pointer" @click="showWorkoutModal = false">
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="flex-1 overflow-y-auto space-y-4 py-4">
          <div class="space-y-2">
            <Label>Ejercicios</Label>
            
            <div v-if="currentWorkout.exercises.length === 0" class="text-center py-8 text-muted-foreground text-sm">
              No hay ejercicios añadidos. Añade el primero abajo.
            </div>

            <div v-for="exercise in currentWorkout.exercises" :key="exercise.id" class="space-y-3 p-4 border rounded-lg">
              <div class="flex items-center justify-between">
                <h3 class="font-medium">{{ exercise.exerciseName }}</h3>
                <Button variant="ghost" size="sm" class="hover:bg-primary/10 hover:text-primary cursor-pointer" @click="addSetToExercise(exercise)">
                  <Plus class="h-4 w-4 mr-1" />
                  Añadir Serie
                </Button>
              </div>

              <div v-if="exercise.sets.length === 0" class="text-sm text-muted-foreground text-center py-2">
                No hay series registradas
              </div>

              <div v-else class="space-y-2">
                <div v-for="set in exercise.sets" :key="set.id" class="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <span class="text-sm font-medium w-8">S{{ set.setNumber }}</span>
                  <Input
                    :model-value="set.reps ?? ''"
                    type="number"
                    placeholder="Reps"
                    class="w-20"
                    @update:model-value="(val) => { set.reps = val ? Number(val) : null }"
                    @blur="updateSet(exercise.id, set.id, { reps: set.reps ?? undefined, weight_kg: set.weightKg ?? undefined })"
                  />
                  <Input
                    :model-value="set.weightKg ?? ''"
                    type="number"
                    step="0.5"
                    placeholder="Kg"
                    class="w-20"
                    @update:model-value="(val) => { set.weightKg = val ? Number(val) : null }"
                    @blur="updateSet(exercise.id, set.id, { reps: set.reps ?? undefined, weight_kg: set.weightKg ?? undefined })"
                  />
                  <span class="text-xs text-muted-foreground flex-1">
                    {{ set.reps || '-' }} reps × {{ set.weightKg || '-' }} kg
                  </span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-2 border-t">
              <Input 
                v-model="newExerciseName" 
                placeholder="Nombre del ejercicio" 
                class="flex-1"
                @keyup.enter="addExercise"
              />
              <Button 
                @click="addExercise" 
                :disabled="!newExerciseName.trim() || addingExercise"
              >
                <Plus class="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t pt-4">
          <Button class="w-full" @click="completeWorkout">
            <Check class="h-4 w-4 mr-2" />
            Finalizar Entrenamiento
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
