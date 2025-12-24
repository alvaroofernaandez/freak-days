<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import type { UserProfile } from '@/composables/useProfile'
import Logo from '@/components/Logo.vue'

interface Props {
  profile: UserProfile | null
}

defineProps<Props>()
</script>

<template>
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
</template>

