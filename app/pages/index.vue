<script setup lang="ts">
import { TrendingUp, Calendar, Award, Zap, Target, Flame } from 'lucide-vue-next'
import LoadingSpinner from '@/components/index/LoadingSpinner.vue'
import WelcomeSection from '@/components/index/WelcomeSection.vue'
import ProfileCard from '@/components/index/ProfileCard.vue'
import ProfileCardSkeleton from '@/components/index/ProfileCardSkeleton.vue'
import StatsCardSkeleton from '@/components/index/StatsCardSkeleton.vue'
import ModuleGrid from '@/components/index/ModuleGrid.vue'
import SettingsPrompt from '@/components/index/SettingsPrompt.vue'
import { useIndexPage } from '@/composables/useIndexPage'
import { useAuthStore } from '~~/stores/auth'
import { useProfile } from '@/composables/useProfile'

const authStore = useAuthStore()
const profileApi = useProfile()

const {
  profile,
  isLoading,
  greeting,
  expProgress,
  quickStats,
  loadingStats,
  modulesStore,
} = useIndexPage()
</script>

<template>
  <div class="space-y-6 w-full">
    <div v-show="!isLoading && !authStore.isAuthenticated" class="min-h-[600px]">
      <WelcomeSection />
    </div>

    <section v-show="authStore.isAuthenticated" class="space-y-6">
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
        <ProfileCardSkeleton v-if="isLoading || !profile" class="md:col-span-2" />
        <ProfileCard 
          v-else-if="profile" 
          :profile="profile"
          :exp-progress="expProgress"
          class="md:col-span-2"
        />

        <StatsCardSkeleton v-if="loadingStats" />
        <Card v-else class="relative overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
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

        <StatsCardSkeleton v-if="loadingStats" />
        <Card v-else class="relative overflow-hidden border-exp-easy/20 bg-linear-to-br from-exp-easy/5 to-transparent">
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

        <StatsCardSkeleton v-if="loadingStats" />
        <Card v-else class="relative overflow-hidden border-exp-legendary/20 bg-linear-to-br from-exp-legendary/5 to-transparent">
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

        <StatsCardSkeleton v-if="loadingStats" />
        <Card v-else class="relative overflow-hidden border-accent/20 bg-linear-to-br from-accent/5 to-transparent">
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
