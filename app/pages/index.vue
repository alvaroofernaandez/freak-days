<script setup lang="ts">
import { useModulesStore } from '~~/stores/modules'
import { useAuthStore } from '~~/stores/auth'
import type { UserProfile } from '@/composables/useProfile'
import { getGreeting } from '@/utils/greeting'
import LoadingSpinner from '@/components/index/LoadingSpinner.vue'
import WelcomeSection from '@/components/index/WelcomeSection.vue'
import ProfileCard from '@/components/index/ProfileCard.vue'
import ModuleGrid from '@/components/index/ModuleGrid.vue'
import SettingsPrompt from '@/components/index/SettingsPrompt.vue'

const modulesStore = useModulesStore()
const profileApi = useProfile()
const supabase = useSupabase()
const authStore = useAuthStore()

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
</script>

<template>
  <div class="space-y-6 w-full">
    <LoadingSpinner v-if="isLoading" />
    
    <WelcomeSection v-else-if="!authStore.isAuthenticated" />

    <section v-else class="space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-2xl sm:text-3xl font-bold">
            {{ greeting }}, {{ profile?.displayName || profile?.username || 'aventurero' }}!
          </h1>
          <p class="text-muted-foreground text-sm sm:text-base">
            ¿Qué quieres hacer hoy?
          </p>
        </div>
      </div>

      <ProfileCard 
        v-if="profile" 
        :profile="profile"
        :exp-progress="expProgress"
      />

      <ClientOnly>
        <ModuleGrid :modules="modulesStore.enabledModules" />
      </ClientOnly>

      <SettingsPrompt />
    </section>
  </div>
</template>
