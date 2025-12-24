<script setup lang="ts">
import type { AppModule } from '~~/domain/types'
import { getModuleIcon } from '~~/domain/constants/module-icons'
import type { ModuleId } from '~~/domain/types'

interface Props {
  module: AppModule
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggle: [id: ModuleId]
}>()
</script>

<template>
  <Card 
    class="transition-all hover:border-primary/30"
    :class="module.enabled ? 'border-primary/50 bg-primary/5' : ''"
  >
    <CardHeader class="flex flex-row items-center justify-between py-3 px-4">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <component :is="getModuleIcon(module.icon)" class="h-5 w-5 text-primary" />
        </div>
        <div class="flex-1 min-w-0">
          <CardTitle class="text-sm font-medium">{{ module.name }}</CardTitle>
          <CardDescription class="text-xs truncate">{{ module.description }}</CardDescription>
        </div>
      </div>
      <Switch 
        :key="`switch-${module.id}-${module.enabled}`"
        :checked="module.enabled === true"
        @update:checked="(checked) => {
          if (checked && !module.enabled) {
            emit('toggle', module.id)
          } else if (!checked && module.enabled) {
            emit('toggle', module.id)
          }
        }"
      />
    </CardHeader>
  </Card>
</template>

