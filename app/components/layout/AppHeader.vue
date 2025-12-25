<script setup lang="ts">
import { Settings, Trophy } from 'lucide-vue-next'
import type { UserProfile } from '@/composables/useProfile'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

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
      <NuxtLink to="/" class="flex items-center gap-2.5 font-bold text-xl group">
        <div class="relative flex items-center justify-center">
          <div class="absolute inset-0 bg-primary/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div class="relative p-1.5 rounded-lg bg-primary/5 border border-primary/10 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300">
            <img 
              src="/logo.png" 
              alt="FreakDays" 
              class="h-7 w-7 rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              loading="eager"
              fetchpriority="high"
            />
          </div>
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
              <span class="text-sm font-semibold">Lv.{{ profile?.level ?? 1 }}</span>
            </div>
            <div class="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                class="h-full bg-linear-to-r from-primary to-exp-legendary rounded-full transition-all duration-300"
                :style="{ width: `${expProgress.progress}%` }"
              />
            </div>
          </div>
          <Avatar class="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
            <AvatarImage 
              v-if="profile?.avatarUrl" 
              :src="profile.avatarUrl" 
              :alt="profile?.displayName || profile?.username"
            />
            <AvatarFallback class="bg-primary/20 text-primary text-sm">
              {{ profile?.username?.charAt(0)?.toUpperCase() ?? '?' }}
            </AvatarFallback>
          </Avatar>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

