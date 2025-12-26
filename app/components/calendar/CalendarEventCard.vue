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
  deleteRequest: [release: Release]
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
  emit('deleteRequest', props.release)
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
    :id="`event-${release.id}`"
    :class="[
      'group relative cursor-grab active:cursor-grabbing touch-manipulation w-full',
      'rounded-lg transition-all duration-200 select-none',
      config.bgColor,
      (isDragging || isDraggingLocal) && 'opacity-40 cursor-grabbing',
      !isDragging && !isDraggingLocal && 'hover:opacity-90 hover:shadow-md focus-within:opacity-90 focus-within:shadow-md',
    ]"
    :style="(isDragging || isDraggingLocal) ? { zIndex: 999999, position: 'relative' } : { zIndex: 50, position: 'relative' }"
    draggable="true"
    role="button"
    :aria-label="`Evento: ${release.title}, ${config.label}. Arrastra para mover o presiona Enter para arrastrar.`"
    :aria-describedby="`event-${release.id}-description`"
    tabindex="0"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @keydown.enter.prevent="handleDragStart"
    @keydown.space.prevent="handleDragStart"
  >
    <div class="px-2 py-1.5 sm:px-2.5 sm:py-2 relative">
      <span :id="`event-${release.id}-description`" class="sr-only">
        {{ config.label }} programado para {{ release.releaseDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) }}
      </span>
      <div class="flex items-center gap-1.5 flex-1 min-w-0">
        <p
          :class="[
            'text-[10px] sm:text-xs font-medium truncate leading-tight flex-1 min-w-0',
            config.color
          ]"
          :title="release.title"
          :aria-label="release.title"
        >
          {{ release.title }}
        </p>
        <button
          class="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all p-1 hover:bg-white/20 active:bg-white/30 rounded shrink-0 touch-manipulation min-h-[28px] min-w-[28px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent focus:opacity-100"
          :class="config.color"
          @click.stop="handleDelete"
          @keydown.enter.stop="handleDelete"
          @keydown.space.stop.prevent="handleDelete"
          :aria-label="`Eliminar evento: ${release.title}`"
          :aria-describedby="`event-${release.id}-description`"
          title="Eliminar evento"
        >
          <Trash2 class="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          <span class="sr-only">Eliminar evento {{ release.title }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

