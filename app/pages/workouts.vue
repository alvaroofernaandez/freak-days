<script setup lang="ts">
import { Dumbbell, Plus, Play } from 'lucide-vue-next'
import WorkoutStats from '@/components/workouts/WorkoutStats.vue'
import WorkoutStatsSkeleton from '@/components/workouts/WorkoutStatsSkeleton.vue'
import WorkoutList from '@/components/workouts/WorkoutList.vue'
import StartWorkoutModal from '@/components/workouts/StartWorkoutModal.vue'
import ActiveWorkoutModal from '@/components/workouts/ActiveWorkoutModal.vue'
import WorkoutDetailModal from '@/components/workouts/WorkoutDetailModal.vue'
import { useWorkoutsPage } from '@/composables/useWorkoutsPage'

const {
  workouts,
  currentWorkout,
  selectedWorkout,
  loading,
  loadingDetail,
  newExerciseName,
  addingExercise,
  stats,
  elapsedTime,
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
} = useWorkoutsPage()

onMounted(() => {
  initialize()
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
          @click="modal.open()"
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
          @click="workoutModal.open()"
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
      @add="modal.open()"
    />

    <StartWorkoutModal
      :open="modal.isOpen.value"
      @close="modal.close()"
      @start="startWorkout"
    />

    <ActiveWorkoutModal
      v-if="currentWorkout"
      :workout="currentWorkout"
      :elapsed-time="elapsedTime"
      v-model:new-exercise-name="newExerciseName"
      :adding-exercise="addingExercise"
      @close="workoutModal.close()"
      @add-exercise="addExercise"
      @add-set="addSetToExercise"
      @update-set="updateSet"
      @remove-set="removeSet"
      @complete="completeWorkout"
    />

    <WorkoutDetailModal
      :workout="selectedWorkout"
      :loading="loadingDetail"
      @close="detailModal.close()"
    />
  </div>
</template>
