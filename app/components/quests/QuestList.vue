<script setup lang="ts">
import { Plus, Trophy, Clock, Loader2 } from 'lucide-vue-next'
import type { Quest } from '~~/domain/types'
import QuestCard from './QuestCard.vue'

interface Props {
  quests: Quest[]
  loading: boolean
  isCompleted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCompleted: false,
})

const emit = defineEmits<{
  complete: [id: string]
  delete: [id: string]
  add: []
}>()
</script>

<template>
  <div>
    <div v-if="loading" class="text-center py-12">
      <Loader2 class="animate-spin w-8 h-8 text-primary mx-auto" />
    </div>

    <div v-else-if="quests.length === 0" class="text-center py-12 sm:py-16">
      <div class="flex flex-col items-center gap-4">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy v-if="!isCompleted" class="h-8 w-8 sm:h-10 sm:w-10 text-primary/50" />
          <Clock v-else class="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
        </div>
        <div class="space-y-2">
          <p class="text-muted-foreground text-sm sm:text-base font-medium">
            {{ isCompleted ? 'Aún no has completado ninguna quest' : '¡Todas las quests completadas!' }}
          </p>
          <p class="text-muted-foreground/70 text-xs sm:text-sm">
            {{ isCompleted ? 'Completa tus primeras misiones para ganar EXP' : 'Crea una nueva misión para continuar' }}
          </p>
        </div>
        <Button v-if="!isCompleted" variant="outline" size="lg" class="mt-2" @click="emit('add')">
          <Plus class="h-4 w-4 mr-2" />
          Nueva misión
        </Button>
      </div>
    </div>

    <div v-else class="space-y-2 sm:space-y-3">
      <QuestCard
        v-for="quest in quests"
        :key="quest.id"
        :quest="quest"
        :is-completed="isCompleted"
        @complete="emit('complete', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>

