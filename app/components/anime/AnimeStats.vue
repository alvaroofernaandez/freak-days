<script setup lang="ts">
interface Props {
  watching: number
  completed: number
  total: number
}

defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:gap-3">
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-primary">{{ watching }}</div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">En curso</div>
    </Card>
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-exp-easy">{{ completed }}</div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Vistos</div>
    </Card>
    <Card class="text-center py-3 sm:py-4">
      <div class="text-xl sm:text-2xl font-bold text-exp-legendary">{{ total }}</div>
      <div class="text-[10px] sm:text-xs text-muted-foreground mt-1">Total</div>
    </Card>
  </div>
</template>

