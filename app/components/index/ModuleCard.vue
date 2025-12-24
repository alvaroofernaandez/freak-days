<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { AppModule } from '~~/domain/types'
import { getModuleIcon } from '~~/domain/constants/module-icons'

interface Props {
  module: AppModule
}

defineProps<Props>()
</script>

<template>
  <Card class="relative h-full transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] overflow-hidden">
    <div class="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />
    <CardHeader class="pb-2 relative z-10">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <component :is="getModuleIcon(module.icon)" class="h-6 w-6 text-primary" />
        </div>
        <div class="flex-1 min-w-0">
          <CardTitle class="text-base truncate">{{ module.name }}</CardTitle>
          <CardDescription class="text-xs truncate">{{ module.description }}</CardDescription>
        </div>
        <ChevronRight class="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </CardHeader>
  </Card>
</template>

