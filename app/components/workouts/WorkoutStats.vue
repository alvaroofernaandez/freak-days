<script setup lang="ts">
import { Flame } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'

interface Props {
  weeklyCount: number
  totalCount: number
  weeklyMinutes: number
}

defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:gap-3">
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-primary">{{ weeklyCount }}</div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Esta semana</div>
    </Card>
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-exp-hard flex items-center justify-center gap-1">
        <Flame class="h-4 w-4 sm:h-5 sm:w-5" />
        {{ totalCount }}
      </div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Total</div>
    </Card>
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-exp-easy">{{ weeklyMinutes }}</div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Min. semana</div>
    </Card>
  </div>
</template>

