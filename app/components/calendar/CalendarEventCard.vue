<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import type { Release, ReleaseType } from '@/composables/useCalendar'

interface Props {
  release: Release
  isDragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
})

const emit = defineEmits<{
  delete: [id: string]
  dragstart: [id: string]
  dragend: []
}>()

const typeConfig: Record<ReleaseType, { color: string; bgColor: string; label: string }> = {
  anime_episode: {
    color: 'text-white',
    bgColor: 'bg-primary',
    label: 'Anime',
  },
  manga_volume: {
    color: 'text-white',
    bgColor: 'bg-exp-easy',
    label: 'Manga',
  },
  event: {
    color: 'text-white',
    bgColor: 'bg-exp-legendary',
    label: 'Evento',
  },
}

const config = computed(() => typeConfig[props.release.type])
const isHovered = ref(false)
const isDraggingLocal = ref(false)


function handleDelete(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
  if (confirm(`¿Eliminar "${props.release.title}"?`)) {
    emit('delete', props.release.id)
  }
}

function handleDragStart(e: DragEvent) {
  if (!e.dataTransfer) return
  
  isDraggingLocal.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.dropEffect = 'move'
  e.dataTransfer.setData('text/plain', props.release.id)
  e.dataTransfer.setData('application/json', JSON.stringify({ id: props.release.id }))
  
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const computedStyle = getComputedStyle(target)
  
  const dragImage = target.cloneNode(true) as HTMLElement
  dragImage.style.position = 'fixed'
  dragImage.style.top = '-1000px'
  dragImage.style.left = '-1000px'
  dragImage.style.width = `${rect.width}px`
  dragImage.style.height = 'auto'
  dragImage.style.opacity = '0.9'
  dragImage.style.pointerEvents = 'none'
  dragImage.style.zIndex = '999999'
  dragImage.style.transform = 'none'
  dragImage.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)'
  
  document.body.appendChild(dragImage)
  
  const offsetX = e.offsetX || rect.width / 2
  const offsetY = e.offsetY || rect.height / 2
  
  e.dataTransfer.setDragImage(dragImage, offsetX, offsetY)
  
  setTimeout(() => {
    if (document.body.contains(dragImage)) {
      document.body.removeChild(dragImage)
    }
  }, 0)
  
  emit('dragstart', props.release.id)
  isHovered.value = false
}

function handleDragEnd() {
  isDraggingLocal.value = false
  emit('dragend')
  isHovered.value = false
}
</script>

<template>
  <div
    :class="[
      'group relative cursor-grab active:cursor-grabbing touch-manipulation w-full',
      'rounded-lg transition-all duration-200 select-none',
      config.bgColor,
      (isDragging || isDraggingLocal) && 'opacity-40 cursor-grabbing',
      !isDragging && !isDraggingLocal && 'hover:opacity-90 hover:shadow-md',
    ]"
    :style="(isDragging || isDraggingLocal) ? { zIndex: 999999, position: 'relative' } : { zIndex: 50, position: 'relative' }"
    draggable="true"
    role="button"
    :aria-label="`Evento: ${release.title}, ${config.label}. Arrastra para mover.`"
    tabindex="0"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @keydown.enter.prevent="handleDragStart"
    @keydown.space.prevent="handleDragStart"
  >
    <div class="px-2 py-1.5 sm:px-2.5 sm:py-2 relative">
      <div class="flex items-center gap-1.5 flex-1 min-w-0">
        <p
          :class="[
            'text-[10px] sm:text-xs font-medium truncate leading-tight flex-1 min-w-0',
            config.color
          ]"
          :title="release.title"
        >
          {{ release.title }}
        </p>
        <button
          class="opacity-0 group-hover:opacity-100 transition-all p-0.5 hover:bg-white/20 rounded shrink-0 touch-manipulation min-h-[24px] min-w-[24px] flex items-center justify-center"
          :class="config.color"
          @click.stop="handleDelete"
          aria-label="Eliminar evento"
          title="Eliminar evento"
        >
          <Trash2 class="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        </button>
      </div>
    </div>
  </div>
</template>

