<script setup lang="ts">
import { Settings, Trophy } from 'lucide-vue-next'
import type { UserProfile } from '@/composables/useProfile'
import Logo from '@/components/Logo.vue'

interface Props {
  profile: UserProfile | null
  expProgress: {
    current: number
    needed: number
    progress: number
  }
  isActive: (to: string) => boolean
}

defineProps<Props>()

const emit = defineEmits<{
  logout: []
}>()
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl lg:block hidden">
    <div class="container mx-auto flex h-14 items-center px-4">
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl group">
        <div class="relative">
          <Logo class="h-6 w-6 transition-transform group-hover:scale-110" />
          <div class="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </NuxtLink>

      <slot name="nav" />

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
                class="h-full bg-linear-to-r from-primary to-exp-legendary rounded-full transition-all duration-300"
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
</template>

