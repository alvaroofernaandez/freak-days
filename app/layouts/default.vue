<script setup lang="ts">
import { useModulesStore } from '~~/stores/modules'
import type { UserProfile } from '@/composables/useProfile'
import { useAuthStore } from '~~/stores/auth'
import { getAllNavItems } from '@/utils/nav-items'
import AppHeader from '@/components/layout/AppHeader.vue'
import MobileHeader from '@/components/layout/MobileHeader.vue'
import DesktopNav from '@/components/layout/DesktopNav.vue'
import DesktopNavSecondary from '@/components/layout/DesktopNavSecondary.vue'
import MobileNav from '@/components/layout/MobileNav.vue'
import MobileMenu from '@/components/layout/MobileMenu.vue'

const route = useRoute()
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

const allNavItems = computed(() => getAllNavItems(modulesStore))
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
    <AppHeader 
      :profile="profile"
      :exp-progress="expProgress"
      :is-active="isActive"
      @logout="handleLogout"
    >
      <template #nav>
        <DesktopNav :items="desktopNavItems" :is-active="isActive" />
        <DesktopNavSecondary :items="desktopSecondaryNavItems" :is-active="isActive" />
      </template>
    </AppHeader>

    <MobileHeader :profile="profile" />

    <main style="width: 100%; flex: 1; display: block;" class="px-4 py-4 lg:py-6 pb-20 lg:pb-6">
      <div style="width: 100%; max-width: 80rem; margin: 0 auto;">
        <slot />
      </div>
    </main>

    <MobileNav
      :items="mobilePreviewItems"
      :is-active="isActive"
      v-model:menu-open="mobileMenuOpen"
    />

    <MobileMenu
      :open="mobileMenuOpen"
      :items="allNavItems"
      :is-active="isActive"
      @close="mobileMenuOpen = false"
      @logout="handleLogout"
    />
  </div>
</template>
