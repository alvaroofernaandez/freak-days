<script setup lang="ts">
import type { Component } from 'vue'

interface NavItem {
  to: string
  icon: Component
  label: string
}

interface Props {
  items: NavItem[]
  isActive: (to: string) => boolean
}

defineProps<Props>()
</script>

<template>
  <nav class="ml-8 flex items-center gap-1">
    <NuxtLink 
      v-for="item in items"
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
  </nav>
</template>

