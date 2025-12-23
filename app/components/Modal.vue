<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  open: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

function close() {
  emit('update:open', false)
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <div
          :class="[
            'w-full bg-card border border-border rounded-lg shadow-lg animate-in zoom-in-95 fade-in duration-200',
            sizeClasses[size]
          ]"
          @click.stop
        >
          <div v-if="title || $slots.header" class="flex items-center justify-between p-4 border-b border-border">
            <div class="flex-1">
              <h3 v-if="title" class="text-lg font-semibold">{{ title }}</h3>
              <p v-if="description" class="text-sm text-muted-foreground mt-1">{{ description }}</p>
              <slot name="header" />
            </div>
            <button
              @click="close"
              class="ml-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          
          <div class="p-4">
            <slot />
          </div>
          
          <div v-if="$slots.footer" class="p-4 border-t border-border">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>

