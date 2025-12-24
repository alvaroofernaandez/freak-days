<script setup lang="ts">
import { Plus, Minus } from 'lucide-vue-next'
import type { WorkoutExercise, WorkoutSet } from '@/composables/useWorkouts'

interface Props {
  exercise: WorkoutExercise
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
})

const emit = defineEmits<{
  addSet: [exerciseId: string]
  updateSet: [exerciseId: string, setId: string, updates: { reps?: number; weight_kg?: number }]
  removeSet: [exerciseId: string, setId: string]
}>()

function handleSetUpdate(exerciseId: string, setId: string, field: 'reps' | 'weightKg', value: string) {
  const updates: { reps?: number; weight_kg?: number } = {}
  if (field === 'reps') {
    updates.reps = value ? Number(value) : undefined
  } else {
    updates.weight_kg = value ? Number(value) : undefined
  }
  emit('updateSet', exerciseId, setId, updates)
}
</script>

<template>
  <div class="space-y-3 p-4 sm:p-5 border rounded-xl bg-card/50">
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-base sm:text-lg mb-1">{{ exercise.exerciseName }}</h3>
        <p v-if="exercise.sets.length > 0" class="text-xs sm:text-sm text-muted-foreground">
          {{ exercise.sets.length }} {{ exercise.sets.length === 1 ? 'serie' : 'series' }}
        </p>
      </div>
      <Button 
        v-if="isActive"
        variant="ghost" 
        size="sm"
        class="h-9 sm:h-10 px-3 sm:px-4 hover:bg-primary/10 hover:text-primary cursor-pointer shrink-0" 
        @click="emit('addSet', exercise.id)"
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
              v-if="isActive"
              :model-value="set.reps ?? ''"
              type="number"
              placeholder="0"
              class="h-10 sm:h-11 text-base font-medium text-center"
              @update:model-value="(val) => handleSetUpdate(exercise.id, set.id, 'reps', val as string)"
              @blur="emit('updateSet', exercise.id, set.id, { reps: set.reps ?? undefined, weight_kg: set.weightKg ?? undefined })"
            />
            <div v-else class="h-10 sm:h-11 flex items-center justify-center text-base font-medium">
              {{ set.reps ?? '-' }}
            </div>
          </div>
          <div class="space-y-1">
            <Label class="text-[10px] sm:text-xs text-muted-foreground">Kg</Label>
            <Input
              v-if="isActive"
              :model-value="set.weightKg ?? ''"
              type="number"
              step="0.5"
              placeholder="0"
              class="h-10 sm:h-11 text-base font-medium text-center"
              @update:model-value="(val) => handleSetUpdate(exercise.id, set.id, 'weightKg', val as string)"
              @blur="emit('updateSet', exercise.id, set.id, { reps: set.reps ?? undefined, weight_kg: set.weightKg ?? undefined })"
            />
            <div v-else class="h-10 sm:h-11 flex items-center justify-center text-base font-medium">
              {{ set.weightKg ?? '-' }}
            </div>
          </div>
        </div>

        <Button
          v-if="isActive"
          variant="ghost"
          size="icon"
          class="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
          @click="emit('removeSet', exercise.id, set.id)"
        >
          <Minus class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

