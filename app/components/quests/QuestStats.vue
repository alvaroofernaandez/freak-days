<script setup lang="ts">
import { Card } from '@/components/ui/card'

interface Props {
  pending: number
  completed: number
  expToday: number
}

defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:gap-3">
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-primary">{{ pending }}</div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Pendientes</div>
    </Card>
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-exp-easy">{{ completed }}</div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Completadas</div>
    </Card>
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-exp-legendary">{{ expToday }}</div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">EXP Hoy</div>
    </Card>
  </div>
</template>

