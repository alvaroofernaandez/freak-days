<script setup lang="ts">
import { Plus, Swords, Trophy, Clock, Trash2, Loader2, AlertCircle, Bell, CheckCircle2, Calendar, X } from 'lucide-vue-next'
import type { Quest, QuestDifficulty } from '../../domain/types'
import { DIFFICULTY_EXP } from '../../domain/types'
import { useQuests } from '../composables/useQuests'

const workoutsApi = useQuests()

const quests = ref<Quest[]>([])
const notifications = ref<Array<{
  id: string
  quest_id: string
  notification_type: 'overdue' | 'reminder' | 'due_soon'
  message: string
  sent_at: Date
  read_at: Date | null
}>>([])
const completions = ref<string[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const showNotifications = ref(false)
const isSubmitting = ref(false)

const newQuest = ref({
  title: '',
  description: '',
  difficulty: 'easy' as QuestDifficulty,
  due_date: '',
  due_time: '',
  reminder_minutes_before: 15,
})

onMounted(async () => {
  await loadData()
  await checkNotifications()
  setInterval(async () => {
    await workoutsApi.checkOverdueQuests()
    await workoutsApi.checkQuestsDueSoon()
    await checkNotifications()
  }, 60000)
})

async function loadData() {
  loading.value = true
  try {
    const [questsData, completionsData] = await Promise.all([
      workoutsApi.fetchQuests(),
      workoutsApi.fetchTodayCompletions()
    ])
    quests.value = questsData
    completions.value = completionsData
    updateQuestStatuses()
  } finally {
    loading.value = false
  }
}

async function checkNotifications() {
  try {
    const notifs = await workoutsApi.fetchNotifications()
    notifications.value = notifs
  } catch (error) {
    console.error('Error fetching notifications:', error)
  }
}

function updateQuestStatuses() {
  const now = new Date()
  quests.value = quests.value.map(quest => {
    if (!quest.dueDate) return quest
    
    const dueDateTime = quest.dueTime 
      ? new Date(`${quest.dueDate.toISOString().split('T')[0]}T${quest.dueTime}`)
      : new Date(quest.dueDate)
    dueDateTime.setHours(quest.dueTime ? parseInt(quest.dueTime.split(':')[0]) : 23, quest.dueTime ? parseInt(quest.dueTime.split(':')[1]) : 59, 59)
    
    const isOverdue = dueDateTime < now && !completions.value.includes(quest.id)
    const isDueSoon = !isOverdue && quest.reminderMinutesBefore && 
      (dueDateTime.getTime() - now.getTime()) <= (quest.reminderMinutesBefore * 60 * 1000) &&
      dueDateTime > now && !completions.value.includes(quest.id)
    
    return {
      ...quest,
      isOverdue,
      isDueSoon,
    }
  })
}

async function addQuest() {
  if (!newQuest.value.title.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await workoutsApi.createQuest({
      title: newQuest.value.title.trim(),
      description: newQuest.value.description?.trim() || undefined,
      difficulty: newQuest.value.difficulty,
      exp_reward: DIFFICULTY_EXP[newQuest.value.difficulty],
      due_date: newQuest.value.due_date || undefined,
      due_time: newQuest.value.due_time || undefined,
      reminder_minutes_before: newQuest.value.due_date ? (newQuest.value.reminder_minutes_before || 15) : undefined,
    })
    newQuest.value = { title: '', description: '', difficulty: 'easy', due_date: '', due_time: '', reminder_minutes_before: 15 }
    showAddModal.value = false
    await loadData()
  } finally {
    isSubmitting.value = false
  }
}

async function completeQuest(quest: Quest) {
  await workoutsApi.completeQuest(quest.id)
  await loadData()
  await checkNotifications()
}

async function deleteQuest(id: string) {
  await workoutsApi.deleteQuest(id)
  await loadData()
}

async function markNotificationAsRead(notificationId: string) {
  await workoutsApi.markNotificationRead(notificationId)
  await checkNotifications()
}

const pendingQuests = computed(() => 
  quests.value.filter(q => !completions.value.includes(q.id))
)

const completedQuests = computed(() => 
  quests.value.filter(q => completions.value.includes(q.id))
)

const overdueQuests = computed(() => 
  pendingQuests.value.filter(q => q.isOverdue)
)

const dueSoonQuests = computed(() => 
  pendingQuests.value.filter(q => q.isDueSoon && !q.isOverdue)
)

const totalExpToday = computed(() => 
  completedQuests.value.reduce((sum, q) => sum + q.exp, 0)
)

const unreadNotifications = computed(() => 
  notifications.value.filter(n => !n.read_at)
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

function formatDueDate(quest: Quest): string {
  if (!quest.dueDate) return ''
  const today = new Date()
  const dueDate = new Date(quest.dueDate)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  if (dueDate.toDateString() === today.toDateString()) return 'Hoy'
  if (dueDate.toDateString() === tomorrow.toDateString()) return 'Mañana'
  return dueDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDueTime(quest: Quest): string {
  if (!quest.dueTime) return ''
  return quest.dueTime.substring(0, 5)
}

function getTimeRemaining(quest: Quest): string {
  if (!quest.dueDate) return ''
  const now = new Date()
  const dueDateTime = quest.dueTime 
    ? new Date(`${quest.dueDate.toISOString().split('T')[0]}T${quest.dueTime}`)
    : new Date(quest.dueDate)
  dueDateTime.setHours(quest.dueTime ? parseInt(quest.dueTime.split(':')[0]) : 23, quest.dueTime ? parseInt(quest.dueTime.split(':')[1]) : 59, 59)
  
  const diff = dueDateTime.getTime() - now.getTime()
  if (diff < 0) return 'Atrasada'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Swords class="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Misiones Diarias
        </h1>
        <p class="text-muted-foreground text-xs sm:text-sm mt-0.5">
          Completa quests y gana experiencia
        </p>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="lg"
          class="relative flex-1 sm:flex-none"
          @click="showNotifications = true"
        >
          <Bell class="h-4 w-4 sm:h-5 sm:w-5" />
          <span class="sm:hidden">Notif.</span>
          <span class="hidden sm:inline">Notificaciones</span>
          <Badge 
            v-if="unreadNotifications.length > 0"
            class="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground"
          >
            {{ unreadNotifications.length }}
          </Badge>
        </Button>
        <Button 
          size="lg"
          class="flex-1 sm:flex-none sm:h-10 sm:w-auto rounded-full glow-primary" 
          @click="showAddModal = true"
        >
          <Plus class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          <span class="sm:hidden">Nueva</span>
          <span class="hidden sm:inline">Nueva Quest</span>
        </Button>
      </div>
    </header>

    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <Card class="text-center py-3 sm:py-4">
        <div class="text-xl sm:text-2xl font-bold text-primary">{{ pendingQuests.length }}</div>
        <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Pendientes</div>
      </Card>
      <Card class="text-center py-3 sm:py-4">
        <div class="text-xl sm:text-2xl font-bold text-exp-easy">{{ completedQuests.length }}</div>
        <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Completadas</div>
      </Card>
      <Card class="text-center py-3 sm:py-4">
        <div class="text-xl sm:text-2xl font-bold text-exp-legendary">{{ totalExpToday }}</div>
        <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">EXP Hoy</div>
      </Card>
    </div>

    <div v-if="overdueQuests.length > 0" class="p-3 sm:p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
      <div class="flex items-start gap-3">
        <AlertCircle class="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-destructive mb-1">Misiones Atrasadas</h3>
          <p class="text-xs text-muted-foreground">
            Tienes {{ overdueQuests.length }} {{ overdueQuests.length === 1 ? 'misión' : 'misiones' }} atrasada{{ overdueQuests.length === 1 ? '' : 's' }}
          </p>
        </div>
      </div>
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
        <div v-if="loading" class="text-center py-12">
          <Loader2 class="animate-spin w-8 h-8 text-primary mx-auto" />
        </div>

        <div v-else-if="pendingQuests.length === 0" class="text-center py-12 sm:py-16">
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy class="h-8 w-8 sm:h-10 sm:w-10 text-primary/50" />
            </div>
            <div class="space-y-2">
              <p class="text-muted-foreground text-sm sm:text-base font-medium">¡Todas las quests completadas!</p>
              <p class="text-muted-foreground/70 text-xs sm:text-sm">Crea una nueva misión para continuar</p>
            </div>
            <Button variant="outline" size="lg" class="mt-2" @click="showAddModal = true">
              <Plus class="h-4 w-4 mr-2" />
              Nueva misión
            </Button>
          </div>
        </div>

        <div v-else class="space-y-2 sm:space-y-3">
          <Card 
            v-for="quest in pendingQuests" 
            :key="quest.id"
            :class="[
              'transition-all active:scale-[0.98]',
              quest.isOverdue ? 'border-destructive/50 bg-destructive/5' : '',
              quest.isDueSoon ? 'border-exp-hard/50 bg-exp-hard/5' : ''
            ]"
          >
            <CardHeader class="py-3 sm:py-4 px-3 sm:px-4">
              <div class="flex items-start gap-3">
                <button 
                  class="mt-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-muted-foreground/30 hover:border-primary transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  :disabled="isSubmitting"
                  @click="completeQuest(quest)"
                >
                  <CheckCircle2 v-if="completions.includes(quest.id)" class="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <CardTitle class="text-sm sm:text-base font-medium">{{ quest.title }}</CardTitle>
                    <Badge :class="difficultyColors[quest.difficulty]" class="text-[10px] px-1.5 py-0">
                      {{ difficultyLabels[quest.difficulty] }}
                    </Badge>
                    <Badge 
                      v-if="quest.isOverdue"
                      variant="destructive"
                      class="text-[10px] px-1.5 py-0"
                    >
                      Atrasada
                    </Badge>
                    <Badge 
                      v-else-if="quest.isDueSoon"
                      class="text-[10px] px-1.5 py-0 bg-exp-hard/20 text-exp-hard border-exp-hard/30"
                    >
                      Próxima
                    </Badge>
                  </div>
                  <CardDescription v-if="quest.description" class="text-xs sm:text-sm mt-0.5 line-clamp-2">
                    {{ quest.description }}
                  </CardDescription>
                  <div class="flex items-center gap-3 mt-2 flex-wrap">
                    <span class="text-xs sm:text-sm text-exp-legendary font-medium">+{{ quest.exp }} EXP</span>
                    <div v-if="quest.dueDate" class="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar class="h-3 w-3" />
                      <span>{{ formatDueDate(quest) }}</span>
                      <span v-if="quest.dueTime">{{ formatDueTime(quest) }}</span>
                      <span v-if="!quest.isOverdue" class="text-exp-hard">· {{ getTimeRemaining(quest) }}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                  :disabled="isSubmitting"
                  @click="deleteQuest(quest.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="completed" class="mt-4 space-y-3">
        <div v-if="completedQuests.length === 0" class="text-center py-12 sm:py-16">
          <div class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted/30 flex items-center justify-center">
              <Clock class="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
            </div>
            <div class="space-y-2">
              <p class="text-muted-foreground text-sm sm:text-base font-medium">Aún no has completado ninguna quest</p>
              <p class="text-muted-foreground/70 text-xs sm:text-sm">Completa tus primeras misiones para ganar EXP</p>
            </div>
          </div>
        </div>

        <div v-else class="space-y-2 sm:space-y-3">
          <Card 
            v-for="quest in completedQuests" 
            :key="quest.id"
            class="opacity-70 hover:opacity-100 transition-opacity"
          >
            <CardHeader class="py-3 sm:py-4 px-3 sm:px-4">
              <div class="flex items-start gap-3">
                <div class="mt-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-exp-easy flex items-center justify-center shrink-0">
                  <CheckCircle2 class="h-4 w-4 sm:h-5 sm:w-5 text-background" />
                </div>
                <div class="flex-1 min-w-0">
                  <CardTitle class="text-sm sm:text-base font-medium line-through">{{ quest.title }}</CardTitle>
                  <div class="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                    <span class="text-exp-easy font-medium">+{{ quest.exp }} EXP ganados</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <Card class="w-full max-w-md my-auto shadow-xl border-2">
        <CardHeader class="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b">
          <CardTitle class="text-lg sm:text-xl">Nueva Quest</CardTitle>
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
            <Label for="title" class="text-sm font-medium">Título</Label>
            <Input 
              id="title" 
              v-model="newQuest.title" 
              placeholder="Ej: Meditar 10 minutos"
              class="w-full h-11 text-base"
              :disabled="isSubmitting"
              @keyup.enter="addQuest"
              autofocus
            />
          </div>
          <div class="space-y-2">
            <Label for="description" class="text-sm font-medium">Descripción (opcional)</Label>
            <Input 
              id="description" 
              v-model="newQuest.description" 
              placeholder="Detalles de la misión..."
              class="w-full h-11 text-base"
              :disabled="isSubmitting"
            />
          </div>
          <div class="space-y-2">
            <Label class="text-sm font-medium">Dificultad</Label>
            <div class="grid grid-cols-4 gap-2">
              <Button 
                v-for="(exp, diff) in DIFFICULTY_EXP"
                :key="diff"
                :variant="newQuest.difficulty === diff ? 'default' : 'outline'"
                size="sm"
                class="text-xs h-10"
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
          <div class="space-y-2">
            <Label for="due_date" class="text-sm font-medium">Fecha límite (opcional)</Label>
            <Input 
              id="due_date" 
              v-model="newQuest.due_date" 
              type="date"
              class="w-full h-11 text-base"
              :disabled="isSubmitting"
            />
          </div>
          <div v-if="newQuest.due_date" class="space-y-2">
            <Label for="due_time" class="text-sm font-medium">Hora límite (opcional)</Label>
            <Input 
              id="due_time" 
              v-model="newQuest.due_time" 
              type="time"
              class="w-full h-11 text-base"
              :disabled="isSubmitting"
            />
          </div>
          <div v-if="newQuest.due_date" class="space-y-2">
            <Label for="reminder" class="text-sm font-medium">Recordatorio (minutos antes)</Label>
            <Input 
              id="reminder" 
              v-model.number="newQuest.reminder_minutes_before" 
              type="number"
              min="1"
              max="1440"
              class="w-full h-11 text-base"
              :disabled="isSubmitting"
            />
          </div>
          <Button 
            size="lg" 
            class="w-full h-12 text-base font-semibold mt-2" 
            @click="addQuest" 
            :disabled="!newQuest.title.trim() || isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="h-5 w-5 mr-2 animate-spin" />
            <Plus v-else class="h-5 w-5 mr-2" />
            Crear Quest
          </Button>
        </CardContent>
      </Card>
    </div>

    <div v-if="showNotifications" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <Card class="w-full max-w-md my-auto shadow-xl border-2">
        <CardHeader class="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b">
          <CardTitle class="text-lg sm:text-xl flex items-center gap-2">
            <Bell class="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            class="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted hover:text-foreground cursor-pointer" 
            @click="showNotifications = false"
          >
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-2 pt-4 max-h-[60vh] overflow-y-auto">
          <div v-if="notifications.length === 0" class="text-center py-8">
            <Bell class="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <p class="text-muted-foreground text-sm">No hay notificaciones</p>
          </div>
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            :class="[
              'p-3 sm:p-4 rounded-lg border transition-all cursor-pointer',
              notification.read_at ? 'bg-muted/30 opacity-70' : 'bg-card',
              notification.notification_type === 'overdue' ? 'border-destructive/30' : '',
              notification.notification_type === 'due_soon' ? 'border-exp-hard/30' : ''
            ]"
            @click="markNotificationAsRead(notification.id)"
          >
            <div class="flex items-start gap-3">
              <AlertCircle 
                :class="[
                  'h-5 w-5 shrink-0 mt-0.5',
                  notification.notification_type === 'overdue' ? 'text-destructive' : 'text-exp-hard'
                ]"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">{{ notification.message }}</p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ new Date(notification.sent_at).toLocaleString('es-ES') }}
                </p>
              </div>
              <div v-if="!notification.read_at" class="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
