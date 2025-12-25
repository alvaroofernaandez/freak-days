<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Ticket, Trash2, Tv } from 'lucide-vue-next'
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

const typeConfig: Record<ReleaseType, { icon: any; color: string; bgColor: string; borderColor: string; label: string }> = {
  anime_episode: {
    icon: Tv,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    label: 'Anime',
  },
  manga_volume: {
    icon: BookOpen,
    color: 'text-exp-easy',
    bgColor: 'bg-exp-easy/10',
    borderColor: 'border-exp-easy/30',
    label: 'Manga',
  },
  event: {
    icon: Ticket,
    color: 'text-exp-legendary',
    bgColor: 'bg-exp-legendary/10',
    borderColor: 'border-exp-legendary/30',
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
  <Card
    :class="[
      'group relative cursor-grab active:cursor-grabbing touch-manipulation w-full',
      'transition-all duration-200 hover:shadow-sm',
      'border select-none',
      config.bgColor,
      config.borderColor,
      (isDragging || isDraggingLocal) && 'opacity-40 cursor-grabbing',
      !isDragging && !isDraggingLocal && 'hover:border-opacity-60',
    ]"
    :style="(isDragging || isDraggingLocal) ? { zIndex: 999999, position: 'relative' } : {}"
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
    <CardContent class="p-1.5 sm:p-2 space-y-1 relative">
      <div class="flex items-center gap-1 flex-1 min-w-0">
        <component
          :is="config.icon"
          :class="['h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0', config.color]"
          aria-hidden="true"
        />
        <p
          class="text-[10px] sm:text-xs font-medium truncate leading-tight flex-1 min-w-0"
          :title="release.title"
        >
          {{ release.title }}
        </p>
        <button
          class="opacity-0 group-hover:opacity-100 transition-all p-0.5 hover:bg-destructive/20 rounded text-destructive hover:text-destructive shrink-0 touch-manipulation min-h-[32px] min-w-[32px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center"
          @click.stop="handleDelete"
          aria-label="Eliminar evento"
          title="Eliminar evento"
        >
          <Trash2 class="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        </button>
      </div>
    </CardContent>
  </Card>
</template>

