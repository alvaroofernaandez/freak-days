<script setup lang="ts">
import { Home, Settings, Swords, Calendar, Users, Dumbbell, Trophy, User, Tv, BookOpen, Menu, X, LogOut } from 'lucide-vue-next'
import { useModulesStore } from '../../stores/modules'
import type { UserProfile } from '../composables/useProfile'
import { useAuthStore } from '~~/stores/auth'
import Logo from '../components/Logo.vue'

const route = useRoute()
const router = useRouter()
const modulesStore = useModulesStore()
const profileApi = useProfile()
const auth = useAuth()

const profile = ref<UserProfile | null>(null)
const mobileMenuOpen = ref(false)

onMounted(async () => {
  profile.value = await profileApi.fetchProfile()
})

watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

const expProgress = computed(() => {
  if (!profile.value) return { current: 0, needed: 100, progress: 0 }
  return profileApi.expForNextLevel(profile.value.totalExp)
})

const allNavItems = computed(() => {
  const items: Array<{ to: string; icon: any; label: string }> = [
    { to: '/', icon: Home, label: 'Inicio' }
  ]

  if (modulesStore.getModuleById('quests')?.enabled) {
    items.push({ to: '/quests', icon: Swords, label: 'Quests' })
  }
  if (modulesStore.getModuleById('anime')?.enabled) {
    items.push({ to: '/anime', icon: Tv, label: 'Anime' })
  }
  if (modulesStore.getModuleById('manga')?.enabled) {
    items.push({ to: '/manga', icon: BookOpen, label: 'Manga' })
  }
  if (modulesStore.getModuleById('workouts')?.enabled) {
    items.push({ to: '/workouts', icon: Dumbbell, label: 'Gym' })
  }
  if (modulesStore.getModuleById('calendar')?.enabled) {
    items.push({ to: '/calendar', icon: Calendar, label: 'Calendario' })
  }
  if (modulesStore.getModuleById('party')?.enabled) {
    items.push({ to: '/party', icon: Users, label: 'Party' })
  }

  return items
})

const desktopNavItems = computed(() => allNavItems.value.slice(0, 5))
const desktopSecondaryNavItems = computed(() => allNavItems.value.slice(5))

const mobilePreviewItems = computed(() => allNavItems.value.slice(0, 4))

function isActive(to: string) {
  return route.path === to
}

async function handleLogout() {
  await auth.signOut()
}
</script>

<template>
  <div style="width: 100%; min-height: 100vh; display: flex; flex-direction: column;" class="bg-background font-sans antialiased">
    <!-- Desktop Header -->
    <header class="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl lg:block hidden">
      <div class="container mx-auto flex h-14 items-center px-4">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl group">
          <div class="relative">
            <Logo class="h-6 w-6 transition-transform group-hover:scale-110" />
            <div class="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </NuxtLink>

        <nav class="ml-8 flex items-center gap-1">
          <ClientOnly>
            <div class="contents">
              <NuxtLink 
                v-for="item in desktopNavItems"
                :key="item.to"
                :to="item.to" 
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                :class="isActive(item.to) 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
              >
                <component :is="item.icon" class="h-4 w-4" />
                {{ item.label }}
              </NuxtLink>
              
              <div v-if="desktopSecondaryNavItems.length > 0" class="flex items-center gap-1">
                <div class="w-px h-6 bg-border mx-2" />
                <NuxtLink 
                  v-for="item in desktopSecondaryNavItems"
                  :key="item.to"
                  :to="item.to" 
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  :class="isActive(item.to) 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
                >
                  <component :is="item.icon" class="h-4 w-4" />
                  {{ item.label }}
                </NuxtLink>
              </div>
            </div>
          </ClientOnly>
        </nav>

        <div class="ml-auto flex items-center gap-4">
          <NuxtLink 
            to="/settings"
            class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            :class="isActive('/settings') && 'bg-primary/10 text-primary'"
          >
            <Settings class="h-5 w-5" />
          </NuxtLink>

          <NuxtLink 
            v-if="profile" 
            to="/profile"
            class="flex items-center gap-3 pl-4 border-l border-border group"
          >
            <div class="flex flex-col items-end">
              <div class="flex items-center gap-1.5">
                <div class="relative">
                  <Trophy class="h-4 w-4 text-exp-legendary" />
                </div>
                <span class="text-sm font-semibold">Lv.{{ profile.level }}</span>
              </div>
              <div class="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-primary to-exp-legendary rounded-full transition-all duration-300"
                  :style="{ width: `${expProgress.progress}%` }"
                />
              </div>
            </div>
            <Avatar class="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
              <AvatarFallback class="bg-primary/20 text-primary text-sm">
                {{ profile.username?.charAt(0)?.toUpperCase() ?? '?' }}
              </AvatarFallback>
            </Avatar>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Mobile Header -->
    <header class="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl lg:hidden">
      <div class="flex h-14 items-center justify-between px-4">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg">
          <Logo class="h-5 w-5" />
        </NuxtLink>
        
        <NuxtLink 
          v-if="profile" 
          to="/profile"
          class="flex items-center gap-2"
        >
          <div class="flex items-center gap-1.5">
            <Trophy class="h-4 w-4 text-exp-legendary" />
            <span class="text-sm font-semibold">Lv.{{ profile.level }}</span>
          </div>
          <Avatar class="h-8 w-8">
            <AvatarFallback class="bg-primary/20 text-primary text-xs">
              {{ profile.username?.charAt(0)?.toUpperCase() ?? '?' }}
            </AvatarFallback>
          </Avatar>
        </NuxtLink>
      </div>
    </header>

    <!-- Main Content -->
    <main style="width: 100%; flex: 1; display: block;" class="px-4 py-4 lg:py-6 pb-20 lg:pb-6">
      <div style="width: 100%; max-width: 80rem; margin: 0 auto;">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Nav -->
    <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
      <div class="flex h-16 items-center justify-around px-2 max-w-md mx-auto">
        <ClientOnly>
          <div class="contents">
            <NuxtLink 
              v-for="item in mobilePreviewItems"
              :key="item.to"
              :to="item.to" 
              class="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all active:scale-95 w-16"
              :class="isActive(item.to) 
                ? 'text-primary' 
                : 'text-muted-foreground'"
            >
              <div class="relative">
                <component 
                  :is="item.icon" 
                  class="h-5 w-5 transition-transform"
                  :class="isActive(item.to) ? 'scale-110' : ''"
                />
                <div 
                  v-if="isActive(item.to)"
                  class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                />
              </div>
              <span class="text-[10px] font-medium truncate w-full text-center">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </ClientOnly>

        <!-- Menu Toggle Button -->
        <button 
          class="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all active:scale-95 w-16 text-muted-foreground"
          :class="mobileMenuOpen ? 'text-primary' : ''"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <div class="relative">
            <Menu 
              class="h-5 w-5 transition-transform"
              :class="mobileMenuOpen ? 'scale-110' : ''"
            />
          </div>
          <span class="text-[10px] font-medium">Menú</span>
        </button>
      </div>
    </nav>

    <!-- Mobile Full Menu Overlay -->
    <div 
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm lg:hidden flex flex-col pt-16 animate-in slide-in-from-bottom-10 fade-in duration-200"
    >
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <div class="grid grid-cols-2 gap-3">
          <ClientOnly>
            <div class="contents">
              <NuxtLink 
                v-for="item in allNavItems" 
                :key="item.to"
                :to="item.to"
                class="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors gap-2"
                :class="isActive(item.to) ? 'border-primary bg-primary/5' : ''"
              >
                <component :is="item.icon" class="h-6 w-6" :class="isActive(item.to) ? 'text-primary' : 'text-muted-foreground'" />
                <span class="font-medium text-sm">{{ item.label }}</span>
              </NuxtLink>
            </div>
          </ClientOnly>
        </div>

        <div class="space-y-4">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider px-2">
            Cuenta
          </h3>
          <div class="bg-card rounded-xl border border-border/50 overflow-hidden">
            <NuxtLink to="/profile" class="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/50">
              <User class="h-5 w-5 text-muted-foreground" />
              <div class="flex-1">
                <div class="font-medium">Mi Perfil</div>
                <div class="text-xs text-muted-foreground">Ver progreso y estadísticas</div>
              </div>
              <Trophy class="h-4 w-4 text-exp-legendary" />
            </NuxtLink>
            <NuxtLink to="/settings" class="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/50">
              <Settings class="h-5 w-5 text-muted-foreground" />
              <div class="flex-1">
                <div class="font-medium">Configuración</div>
                <div class="text-xs text-muted-foreground">Gestionar módulos</div>
              </div>
            </NuxtLink>
            <button @click="handleLogout" class="w-full flex items-center gap-3 p-4 hover:bg-destructive/10 transition-colors text-destructive text-left">
              <LogOut class="h-5 w-5" />
              <span class="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-border">
        <Button variant="outline" class="w-full" @click="mobileMenuOpen = false">
          <X class="h-4 w-4 mr-2" />
          Cerrar Menú
        </Button>
      </div>
    </div>
  </div>
</template>
