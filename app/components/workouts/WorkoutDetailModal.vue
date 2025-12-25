<script setup lang="ts">
import { X, Clock, Dumbbell } from 'lucide-vue-next'
import type { Workout } from '@/composables/useWorkouts'
import { formatDate, formatDuration } from '@/utils/workout-formatters'
import { calculateWorkoutStats } from '@/utils/workout-calculations'
import WorkoutDetailStats from './WorkoutDetailStats.vue'
import ExerciseCard from './ExerciseCard.vue'

type ReadonlyWorkout = {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly workoutDate: Date
  readonly durationMinutes: number | null
  readonly notes: string | null
  readonly status: 'in_progress' | 'completed'
  readonly startedAt: Date | null
  readonly completedAt: Date | null
  readonly exercises: readonly ReadonlyWorkoutExercise[]
}

type ReadonlyWorkoutExercise = {
  readonly id: string
  readonly exerciseName: string
  readonly notes: string | null
  readonly orderIndex: number
  readonly sets: readonly ReadonlyWorkoutSet[]
}

type ReadonlyWorkoutSet = {
  readonly id: string
  readonly setNumber: number
  readonly reps: number | null
  readonly weightKg: number | null
  readonly restSeconds: number | null
  readonly notes: string | null
}

interface Props {
  workout: ReadonlyWorkout | Workout | null
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const stats = computed(() => {
  if (!props.workout) return null
  return calculateWorkoutStats(props.workout)
})
</script>

<template>
  <div v-if="workout" class="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
    <div class="flex-1 overflow-y-auto">
      <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div class="max-w-3xl mx-auto px-4 py-3 sm:py-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <CardTitle class="text-lg sm:text-xl font-bold truncate flex items-center gap-2">
                <Dumbbell class="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                {{ workout.name }}
              </CardTitle>
              <CardDescription class="text-xs sm:text-sm mt-1 flex items-center gap-3 flex-wrap">
                <span class="flex items-center gap-1.5">
                  <Clock class="h-3 w-3 sm:h-4 sm:w-4" />
                  {{ formatDate(workout.workoutDate) }} · {{ formatDuration(workout.durationMinutes) }}
                </span>
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-9 w-9 sm:h-10 sm:w-10 hover:bg-muted hover:text-foreground cursor-pointer shrink-0" 
              @click="emit('close')"
            >
              <X class="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>

      <div v-else class="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div v-if="workout.description" class="p-3 sm:p-4 bg-muted/30 rounded-lg border">
          <p class="text-sm sm:text-base text-muted-foreground">{{ workout.description }}</p>
        </div>

        <WorkoutDetailStats v-if="stats" :stats="stats" />

        <div v-if="workout.exercises.length === 0" class="text-center py-12 sm:py-16">
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
          <ExerciseCard
            v-for="exercise in workout.exercises"
            :key="exercise.id"
            :exercise="exercise"
            :is-active="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

