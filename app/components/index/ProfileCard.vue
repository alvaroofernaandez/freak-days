<script setup lang="ts">
import { Zap, Target, Trophy } from 'lucide-vue-next'
import type { UserProfile } from '@/composables/useProfile'

interface Props {
  profile: UserProfile
  expProgress: {
    current: number
    needed: number
    progress: number
  }
}

defineProps<Props>()
</script>

<template>
  <Card class="overflow-hidden bg-linear-to-br from-primary/10 via-background to-exp-legendary/10">
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
</template>

