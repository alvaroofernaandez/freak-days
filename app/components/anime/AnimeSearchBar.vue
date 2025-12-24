<script setup lang="ts">
import { Search, X, Loader2 } from 'lucide-vue-next'

interface Props {
  query: string
  searching: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:query': [value: string]
  search: [query: string]
  clear: []
}>()

const localQuery = ref(props.query || '')

watch(() => props.query, (newQuery) => {
  if (newQuery !== localQuery.value) {
    localQuery.value = newQuery || ''
  }
})

function handleInput(value: string) {
  localQuery.value = value
  emit('update:query', value)
  emit('search', value)
}

function handleClear() {
  localQuery.value = ''
  emit('update:query', '')
  emit('clear')
}
</script>

<template>
  <div class="relative">
    <div class="relative flex items-center">
      <Search v-if="!searching" class="absolute left-3 h-5 w-5 text-muted-foreground pointer-events-none" />
      <Loader2 v-else class="absolute left-3 h-5 w-5 text-primary animate-spin pointer-events-none" />
      <Input
        :model-value="localQuery"
        @update:model-value="handleInput"
        placeholder="Buscar anime (ej: One Piece, Naruto...)"
        class="pl-10 pr-10 h-12 text-base"
        autofocus
      />
      <Button
        v-if="localQuery"
        variant="ghost"
        size="icon"
        class="absolute right-1 h-8 w-8 hover:bg-muted"
        @click="handleClear"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

