<script setup lang="ts">
import { Plus, Swords, Trophy, Clock, Trash2, Loader2 } from 'lucide-vue-next'
import type { Quest, QuestDifficulty } from '../../domain/types'
import { DIFFICULTY_EXP } from '../../domain/types'
import { useQuestsQuery } from '../composables/useQuestsQuery'

const { quests, completions, createQuest, completeQuest: completeQuestMutation, deleteQuest: deleteQuestMutation } = useQuestsQuery()

const showAddModal = ref(false)
const isSubmitting = ref(false)

const newQuest = ref({
  title: '',
  description: '',
  difficulty: 'easy' as QuestDifficulty
})

const questsList = computed(() => quests.data.value || [])
const completedTodaySet = computed(() => new Set(completions.data.value || []))
const loading = computed(() => quests.isLoading.value || completions.isLoading.value)

async function addQuest() {
  if (!newQuest.value.title.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await createQuest.mutateAsync({
      title: newQuest.value.title,
      description: newQuest.value.description || undefined,
      difficulty: newQuest.value.difficulty,
      exp_reward: DIFFICULTY_EXP[newQuest.value.difficulty]
    })
    newQuest.value = { title: '', description: '', difficulty: 'easy' }
    showAddModal.value = false
  } finally {
    isSubmitting.value = false
  }
}

async function completeQuest(quest: Quest) {
  await completeQuestMutation.mutateAsync({ questId: quest.id })
}

async function deleteQuest(id: string) {
  await deleteQuestMutation.mutateAsync(id)
}

const pendingQuests = computed(() => 
  questsList.value.filter(q => !completedTodaySet.value.has(q.id))
)

const completedQuests = computed(() => 
  questsList.value.filter(q => completedTodaySet.value.has(q.id))
)

const totalExpToday = computed(() => 
  completedQuests.value.reduce((sum, q) => sum + q.exp, 0)
)

const difficultyColors: Record<QuestDifficulty, string> = {
  easy: 'bg-exp-easy/20 text-exp-easy border-exp-easy/30',
  medium: 'bg-exp-medium/20 text-exp-medium border-exp-medium/30',
  hard: 'bg-exp-hard/20 text-exp-hard border-exp-hard/30',
  legendary: 'bg-exp-legendary/20 text-exp-legendary border-exp-legendary/30'
}

const difficultyLabels: Record<QuestDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Normal',
  hard: 'Difícil',
  legendary: 'Legendaria'
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Swords class="h-6 w-6 text-primary" />
          Misiones Diarias
        </h1>
        <p class="text-muted-foreground text-sm">
          Completa quests y gana experiencia
        </p>
      </div>
      <Button size="icon" class="h-10 w-10 rounded-full glow-primary" @click="showAddModal = true">
        <Plus class="h-5 w-5" />
      </Button>
    </header>

    <div class="grid grid-cols-3 gap-3">
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-primary">{{ pendingQuests.length }}</div>
        <div class="text-xs text-muted-foreground">Pendientes</div>
      </Card>
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-exp-easy">{{ completedQuests.length }}</div>
        <div class="text-xs text-muted-foreground">Completadas</div>
      </Card>
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-exp-legendary">{{ totalExpToday }}</div>
        <div class="text-xs text-muted-foreground">EXP Hoy</div>
      </Card>
    </div>

    <Tabs default-value="pending" class="w-full">
      <TabsList class="w-full grid grid-cols-2">
        <TabsTrigger value="pending" class="gap-2">
          <Clock class="h-4 w-4" />
          Pendientes
        </TabsTrigger>
        <TabsTrigger value="completed" class="gap-2">
          <Trophy class="h-4 w-4" />
          Completadas
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending" class="mt-4 space-y-3">
        <div v-if="loading" class="text-center py-8">
          <Loader2 class="animate-spin w-8 h-8 text-primary mx-auto" />
        </div>

        <Card 
          v-for="quest in pendingQuests" 
          :key="quest.id"
          class="transition-all hover:border-primary/30 active:scale-[0.98]"
        >
          <CardHeader class="py-3 px-4">
            <div class="flex items-start gap-3">
              <button 
                class="mt-1 w-6 h-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="completeQuestMutation.isPending.value"
                @click="completeQuest(quest)"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <CardTitle class="text-sm font-medium">{{ quest.title }}</CardTitle>
                  <Badge :class="difficultyColors[quest.difficulty]" class="text-[10px] px-1.5 py-0">
                    {{ difficultyLabels[quest.difficulty] }}
                  </Badge>
                </div>
                <CardDescription v-if="quest.description" class="text-xs mt-0.5">{{ quest.description }}</CardDescription>
                <div class="flex items-center gap-3 mt-2 text-xs">
                  <span class="text-exp-legendary font-medium">+{{ quest.exp }} EXP</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-8 w-8 text-muted-foreground hover:text-destructive disabled:opacity-50" 
                :disabled="deleteQuestMutation.isPending.value"
                @click="deleteQuest(quest.id)"
              >
                <Loader2 v-if="deleteQuestMutation.isPending.value" class="h-4 w-4 animate-spin" />
                <Trash2 v-else class="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div v-if="!loading && pendingQuests.length === 0" class="text-center py-8">
          <Trophy class="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
          <p class="text-muted-foreground text-sm">¡Todas las quests completadas!</p>
        </div>
      </TabsContent>

      <TabsContent value="completed" class="mt-4 space-y-3">
        <Card 
          v-for="quest in completedQuests" 
          :key="quest.id"
          class="opacity-60"
        >
          <CardHeader class="py-3 px-4">
            <div class="flex items-start gap-3">
              <div class="mt-1 w-6 h-6 rounded-full bg-exp-easy flex items-center justify-center shrink-0">
                <svg class="h-4 w-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-sm font-medium line-through">{{ quest.title }}</CardTitle>
                <div class="flex items-center gap-2 mt-1 text-xs">
                  <span class="text-exp-easy">+{{ quest.exp }} EXP ganados</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div v-if="completedQuests.length === 0" class="text-center py-8">
          <Clock class="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
          <p class="text-muted-foreground text-sm">Aún no has completado ninguna quest</p>
        </div>
      </TabsContent>
    </Tabs>

    <Modal v-model:open="showAddModal" title="Nueva Quest" size="sm">
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="title">Título</Label>
          <Input 
            id="title" 
            v-model="newQuest.title" 
            placeholder="Ej: Meditar 10 minutos"
            :disabled="isSubmitting"
            @keyup.enter="addQuest"
          />
        </div>
        <div class="space-y-2">
          <Label for="description">Descripción (opcional)</Label>
          <Input 
            id="description" 
            v-model="newQuest.description" 
            placeholder="Detalles..."
            :disabled="isSubmitting"
          />
        </div>
        <div class="space-y-2">
          <Label>Dificultad</Label>
          <div class="grid grid-cols-4 gap-2">
            <Button 
              v-for="(exp, diff) in DIFFICULTY_EXP"
              :key="diff"
              :variant="newQuest.difficulty === diff ? 'default' : 'outline'"
              size="sm"
              class="text-xs"
              :disabled="isSubmitting"
              @click="newQuest.difficulty = diff"
            >
              {{ difficultyLabels[diff].charAt(0) }}
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            +{{ DIFFICULTY_EXP[newQuest.difficulty] }} EXP
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button variant="outline" @click="showAddModal = false" :disabled="isSubmitting">
            Cancelar
          </Button>
          <Button @click="addQuest" :disabled="!newQuest.title.trim() || isSubmitting">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            Crear Quest
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
