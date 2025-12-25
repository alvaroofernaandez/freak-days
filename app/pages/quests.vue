<script setup lang="ts">
import { Plus, Swords, Bell, Clock, Trophy } from 'lucide-vue-next'
import type { Quest, QuestDifficulty } from '~~/domain/types'
import { DIFFICULTY_EXP } from '~~/domain/types'
import { useQuests } from '@/composables/useQuests'
import QuestStats from '@/components/quests/QuestStats.vue'
import QuestStatsSkeleton from '@/components/quests/QuestStatsSkeleton.vue'
import OverdueBanner from '@/components/quests/OverdueBanner.vue'
import QuestList from '@/components/quests/QuestList.vue'
import QuestFormModal from '@/components/quests/QuestFormModal.vue'
import NotificationPanel from '@/components/quests/NotificationPanel.vue'

interface QuestForm {
  title: string
  description: string
  difficulty: QuestDifficulty
  due_date: string
  due_time: string
  reminder_minutes_before: number
}

const questsApi = useQuests()

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

onMounted(async () => {
  await loadData()
  await checkNotifications()
  setInterval(async () => {
    await questsApi.checkOverdueQuests()
    await questsApi.checkQuestsDueSoon()
    await checkNotifications()
  }, 60000)
})

async function loadData() {
  loading.value = true
  try {
    const [questsData, completionsData] = await Promise.all([
      questsApi.fetchQuests(),
      questsApi.fetchTodayCompletions()
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
    const notifs = await questsApi.fetchNotifications()
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

function handleAddQuest(form: QuestForm) {
  addQuest(form)
}

async function addQuest(form: QuestForm) {
  if (!form.title.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await questsApi.createQuest({
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      difficulty: form.difficulty,
      exp_reward: DIFFICULTY_EXP[form.difficulty],
      due_date: form.due_date || undefined,
      due_time: form.due_time || undefined,
      reminder_minutes_before: form.due_date ? (form.reminder_minutes_before || 15) : undefined,
    })
    showAddModal.value = false
    await loadData()
  } finally {
    isSubmitting.value = false
  }
}

async function completeQuest(questId: string) {
  await questsApi.completeQuest(questId)
  await loadData()
  await checkNotifications()
}

async function deleteQuest(id: string) {
  await questsApi.deleteQuest(id)
  await loadData()
}

async function markNotificationAsRead(notificationId: string) {
  await questsApi.markNotificationRead(notificationId)
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

const totalExpToday = computed(() => 
  completedQuests.value.reduce((sum, q) => sum + q.exp, 0)
)

const unreadNotifications = computed(() => 
  notifications.value.filter(n => !n.read_at)
)
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

    <QuestStatsSkeleton v-if="loading" />
    <QuestStats 
      v-else
      :pending="pendingQuests.length"
      :completed="completedQuests.length"
      :exp-today="totalExpToday"
    />

    <OverdueBanner :count="overdueQuests.length" />

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
        <QuestList
          :quests="pendingQuests"
          :loading="loading"
          :is-completed="false"
          @complete="completeQuest"
          @delete="deleteQuest"
          @add="showAddModal = true"
        />
      </TabsContent>

      <TabsContent value="completed" class="mt-4 space-y-3">
        <QuestList
          :quests="completedQuests"
          :loading="false"
          :is-completed="true"
          @complete="completeQuest"
          @delete="deleteQuest"
          @add="showAddModal = true"
        />
      </TabsContent>
    </Tabs>

    <QuestFormModal
      :open="showAddModal"
      :submitting="isSubmitting"
      @close="showAddModal = false"
      @submit="handleAddQuest"
    />

    <NotificationPanel
      :open="showNotifications"
      :notifications="notifications"
      @close="showNotifications = false"
      @mark-read="markNotificationAsRead"
    />
  </div>
</template>
