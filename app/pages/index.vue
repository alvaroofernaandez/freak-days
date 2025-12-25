<script setup lang="ts">
import { useModulesStore } from '~~/stores/modules'
import { useAuthStore } from '~~/stores/auth'
import type { UserProfile } from '@/composables/useProfile'
import { getGreeting } from '@/utils/greeting'
import { TrendingUp, Calendar, Award, Zap, Target, Flame } from 'lucide-vue-next'
import LoadingSpinner from '@/components/index/LoadingSpinner.vue'
import WelcomeSection from '@/components/index/WelcomeSection.vue'
import ProfileCard from '@/components/index/ProfileCard.vue'
import ModuleGrid from '@/components/index/ModuleGrid.vue'
import SettingsPrompt from '@/components/index/SettingsPrompt.vue'

const modulesStore = useModulesStore()
const profileApi = useProfile()
const supabase = useSupabase()
const authStore = useAuthStore()
const questsApi = useQuests()
const animeApi = useAnime()
const workoutsApi = useWorkouts()

const { data: profile, pending: profilePending } = await useAsyncData<UserProfile | null>(
  'profile',
  () => profileApi.fetchProfile(),
  { default: () => null, server: false }
)

const { pending: modulesPending } = await useAsyncData(
  'user-modules',
  async () => {
    if (import.meta.server) return null
    if (!authStore.isAuthenticated || !authStore.userId) return null
    if (modulesStore.synced) return null
    
    const { data } = await supabase
      .from("user_modules")
      .select("module_id, enabled")
      .eq("user_id", authStore.userId)
    
    if (data && data.length > 0) {
      modulesStore.setModulesFromDb(data)
    } else {
      modulesStore.synced = true
    }
    
    return data
  },
  { default: () => null, server: false }
)

const isLoading = computed(() => profilePending.value || modulesPending.value)
const greeting = computed(() => getGreeting())

const expProgress = computed(() => {
  if (!profile.value) return { current: 0, needed: 100, progress: 0 }
  return profileApi.expForNextLevel(profile.value.totalExp)
})

const quickStats = ref({
  questsToday: 0,
  questsPending: 0,
  animeWatching: 0,
  workoutsThisWeek: 0,
})

const loadingStats = ref(false)

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await loadQuickStats()
  }
})

async function loadQuickStats() {
  loadingStats.value = true
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [quests, completions, anime, workouts] = await Promise.all([
      questsApi.fetchQuests().catch(() => []),
      questsApi.fetchTodayCompletions().catch(() => []),
      animeApi.fetchAnimeList().catch(() => []),
      workoutsApi.fetchWorkouts().catch(() => [])
    ])

    const questsToday = completions.length

    const completionSet = new Set(completions)
    const questsPending = quests.filter(q => !completionSet.has(q.id)).length

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    quickStats.value = {
      questsToday: questsToday,
      questsPending: questsPending,
      animeWatching: anime.filter(a => a.status === 'watching').length,
      workoutsThisWeek: workouts.filter(w => {
        if (!w.workoutDate) return false
        const workoutDate = new Date(w.workoutDate)
        return workoutDate >= weekAgo && w.status === 'completed'
      }).length,
    }
  } catch (error) {
    console.error('Error loading quick stats:', error)
  } finally {
    loadingStats.value = false
  }
}

watch(() => authStore.isAuthenticated, async (isAuth) => {
  if (isAuth) {
    await loadQuickStats()
  }
})
</script>

<template>
  <div class="space-y-6 w-full">
    <LoadingSpinner v-if="isLoading" />
    
    <div v-show="!isLoading && !authStore.isAuthenticated" class="min-h-[600px]">
      <WelcomeSection />
    </div>

    <section v-show="!isLoading && authStore.isAuthenticated" class="space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl sm:text-4xl font-bold bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {{ greeting }}, {{ profile?.displayName || profile?.username || 'aventurero' }}!
          </h1>
          <p class="text-muted-foreground text-base sm:text-lg">
            ¿Qué quieres hacer hoy?
          </p>
        </div>
        <div v-if="profile" class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <Flame class="h-5 w-5 text-exp-legendary" />
          <div class="flex flex-col">
            <span class="text-xs text-muted-foreground">Nivel</span>
            <span class="text-lg font-bold text-primary">{{ profile.level }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfileCard 
          v-if="profile" 
          :profile="profile"
          :exp-progress="expProgress"
          class="md:col-span-2"
        />

        <Card v-if="!loadingStats" class="relative overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
          <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <CardContent class="relative p-6">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Quests Pendientes</p>
                <p class="text-3xl font-bold text-primary">{{ quickStats.questsPending }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Target class="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="!loadingStats" class="relative overflow-hidden border-exp-easy/20 bg-linear-to-br from-exp-easy/5 to-transparent">
          <div class="absolute top-0 right-0 w-32 h-32 bg-exp-easy/10 rounded-full blur-3xl" />
          <CardContent class="relative p-6">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Animes en Curso</p>
                <p class="text-3xl font-bold text-exp-easy">{{ quickStats.animeWatching }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-exp-easy/20 flex items-center justify-center">
                <TrendingUp class="h-6 w-6 text-exp-easy" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="!loadingStats" class="relative overflow-hidden border-exp-legendary/20 bg-linear-to-br from-exp-legendary/5 to-transparent">
          <div class="absolute top-0 right-0 w-32 h-32 bg-exp-legendary/10 rounded-full blur-3xl" />
          <CardContent class="relative p-6">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Quests Hoy</p>
                <p class="text-3xl font-bold text-exp-legendary">{{ quickStats.questsToday }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-exp-legendary/20 flex items-center justify-center">
                <Award class="h-6 w-6 text-exp-legendary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="!loadingStats" class="relative overflow-hidden border-accent/20 bg-linear-to-br from-accent/5 to-transparent">
          <div class="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
          <CardContent class="relative p-6">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm text-muted-foreground">Entrenamientos Semana</p>
                <p class="text-3xl font-bold text-accent">{{ quickStats.workoutsThisWeek }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Calendar class="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <Zap class="h-5 w-5 text-primary" />
          <h2 class="text-xl font-bold">Módulos</h2>
        </div>
        <ClientOnly>
          <ModuleGrid :modules="modulesStore.enabledModules" />
        </ClientOnly>
      </div>

      <SettingsPrompt />
    </section>
  </div>
</template>
