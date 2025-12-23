<script setup lang="ts">
import { Sparkles, ArrowRight, ChevronRight, Zap, Target, Trophy } from 'lucide-vue-next'
import { useModulesStore } from '../../stores/modules'
import { useAuthStore } from '../../stores/auth'
import type { UserProfile } from '../composables/useProfile'

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

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '¡Buenos días'
  if (hour < 18) return '¡Buenas tardes'
  return '¡Buenas noches'
})

const expProgress = computed(() => {
  if (!profile.value) return { current: 0, needed: 100, progress: 0 }
  return profileApi.expForNextLevel(profile.value.totalExp)
})

const iconMap: Record<string, string> = {
  dumbbell: '🏋️',
  'book-open': '📚',
  tv: '📺',
  sword: '⚔️',
  users: '👥',
  calendar: '📅'
}
</script>

<template>
  <div class="space-y-6 w-full" style="width: 100%;">
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
    
    <section v-else-if="!modulesStore.hasCompletedOnboarding" class="flex flex-col items-center text-center space-y-6 py-8">
      <div class="relative">
        <div class="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse" />
        <Sparkles class="relative h-16 w-16 text-primary" />
      </div>
      
      <div class="space-y-2">
        <h1 class="text-3xl sm:text-4xl font-bold text-gradient">
          Bienvenido a FreakDays
        </h1>
        <p class="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
          Tu compañero para gestionar tu vida friki
        </p>
      </div>

      <Button size="lg" class="glow-primary" as-child>
        <NuxtLink to="/onboarding" class="flex items-center gap-2">
          Comenzar Aventura
          <ArrowRight class="h-4 w-4" />
        </NuxtLink>
      </Button>
    </section>

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

      <Card v-if="profile" class="overflow-hidden bg-linear-to-br from-primary/10 via-background to-exp-legendary/10">
        <CardContent class="py-4">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div class="absolute inset-0 bg-exp-legendary/20 blur-xl rounded-full" />
              <div class="relative w-16 h-16 rounded-full bg-linear-to-br from-primary to-exp-legendary flex items-center justify-center">
                <span class="text-2xl font-bold text-white">{{ profile.level }}</span>
              </div>
            </div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Zap class="h-4 w-4 text-exp-legendary" />
                  <span class="text-sm font-medium">Nivel {{ profile.level }}</span>
                </div>
                <span class="text-xs text-muted-foreground">
                  {{ expProgress.current }} / {{ expProgress.needed }} EXP
                </span>
              </div>
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  class="h-full bg-linear-to-r from-primary via-exp-medium to-exp-legendary rounded-full transition-all duration-500"
                  :style="{ width: `${expProgress.progress}%` }"
                />
              </div>
              <div class="flex items-center gap-4 text-xs text-muted-foreground">
                <div class="flex items-center gap-1">
                  <Trophy class="h-3 w-3" />
                  <span>{{ profile.totalExp }} EXP total</span>
                </div>
                <div class="flex items-center gap-1">
                  <Target class="h-3 w-3" />
                  <span>{{ expProgress.needed - expProgress.current }} para subir</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ClientOnly>
        <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="module in modulesStore.enabledModules" 
            :key="module.id"
            :to="`/${module.id}`"
            class="group block"
          >
            <Card class="relative h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] overflow-hidden">
              <div class="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />
              <CardHeader class="pb-2 relative z-10">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span class="text-2xl">{{ iconMap[module.icon] }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <CardTitle class="text-base truncate">{{ module.name }}</CardTitle>
                    <CardDescription class="text-xs truncate">{{ module.description }}</CardDescription>
                  </div>
                  <ChevronRight class="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
            </Card>
          </NuxtLink>
        </div>
      </ClientOnly>

      <Card class="border-dashed border-2 border-muted hover:border-primary/30 transition-colors group">
        <NuxtLink to="/settings">
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <CardTitle class="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                ¿Quieres más módulos?
              </CardTitle>
              <CardDescription class="text-xs">
                Activa más funciones en configuración
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" class="group-hover:bg-primary/10">
              <span class="mr-2">Configurar</span>
              <ArrowRight class="h-4 w-4" />
            </Button>
          </CardHeader>
        </NuxtLink>
      </Card>
    </section>
  </div>
</template>
