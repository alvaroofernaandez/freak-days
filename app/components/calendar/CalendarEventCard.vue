<script setup lang="ts">
import type { Release, ReleaseType } from '@/composables/useCalendar';
import { MoreVertical, Trash2 } from 'lucide-vue-next';

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
  editRequest: [release: Release]
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

const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024
})


function handleDelete(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
  emit('deleteRequest', props.release)
}

function handleEdit(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
  emit('editRequest', props.release)
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

function handleDragStartKeyboard(e: KeyboardEvent) {
  const fakeEvent = {
    ...e,
    dataTransfer: {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: () => { },
      getData: () => props.release.id,
    } as unknown as DataTransfer,
    currentTarget: e.currentTarget,
    offsetX: 0,
    offsetY: 0,
  } as unknown as DragEvent
  handleDragStart(fakeEvent)
}

function handleEditKeyboard(e: KeyboardEvent) {
  const fakeEvent = {
    ...e,
    stopPropagation: () => { },
    preventDefault: () => { },
  } as unknown as MouseEvent
  handleEdit(fakeEvent)
}

function handleDeleteKeyboard(e: KeyboardEvent) {
  const fakeEvent = {
    ...e,
    stopPropagation: () => { },
    preventDefault: () => { },
  } as unknown as MouseEvent
  handleDelete(fakeEvent)
}
</script>

<template>
  <div :id="`event-${release.id}`" :class="[
    'group cursor-grab active:cursor-grabbing touch-manipulation w-full',
    'rounded-lg transition-all duration-200 select-none',
    'active:scale-[0.98] sm:active:scale-100',
    'relative sm:absolute sm:left-0 sm:right-0',
    config.bgColor,
    (isDragging || isDraggingLocal) && 'opacity-40 cursor-grabbing scale-95',
    !isDragging && !isDraggingLocal && 'hover:opacity-90 hover:shadow-md focus-within:opacity-90 focus-within:shadow-md active:opacity-95',
  ]"
    :style="(isDragging || isDraggingLocal) ? { zIndex: 999999, position: 'relative' } : { zIndex: 50, position: 'relative' }"
    :draggable="!isMobile" role="button"
    :aria-label="`Evento: ${release.title}, ${config.label}. Arrastra para mover o presiona Enter para arrastrar.`"
    :aria-describedby="`event-${release.id}-description`" tabindex="0" @dragstart="handleDragStart"
    @dragend="handleDragEnd" @touchstart="isHovered = true" @touchend="isHovered = false" @mouseenter="isHovered = true"
    @mouseleave="isHovered = false" @keydown.enter.prevent="handleDragStartKeyboard"
    @keydown.space.prevent="handleDragStartKeyboard">
    <div class="px-2.5 py-2 sm:px-2.5 sm:py-2 relative min-h-[44px] flex items-center">
      <span :id="`event-${release.id}-description`" class="sr-only">
        {{ config.label }} programado para {{ release.releaseDate.toLocaleDateString('es-ES', {
          day: 'numeric', month:
            'long', year: 'numeric'
        }) }}
      </span>
      <div class="flex items-center gap-1.5 sm:gap-1 flex-1 min-w-0">
        <p :class="[
          'text-[10px] sm:text-xs font-medium truncate leading-tight sm:leading-snug flex-1 min-w-0',
          config.color
        ]" :title="release.title" :aria-label="release.title">
          {{ release.title }}
        </p>
        <div
          class="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
          <button
            class="transition-all p-1 sm:p-1.5 hover:bg-white/20 active:bg-white/30 rounded shrink-0 touch-manipulation min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
            :class="config.color" @click.stop="handleEdit" @keydown.enter.stop="handleEditKeyboard"
            @keydown.space.stop.prevent="handleEditKeyboard" :aria-label="`Editar evento: ${release.title}`"
            :aria-describedby="`event-${release.id}-description`" title="Editar evento">
            <MoreVertical class="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <span class="sr-only">Editar evento {{ release.title }}</span>
          </button>
          <button
            class="transition-all p-1 sm:p-1.5 hover:bg-white/20 active:bg-white/30 rounded shrink-0 touch-manipulation min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
            :class="config.color" @click.stop="handleDelete" @keydown.enter.stop="handleDeleteKeyboard"
            @keydown.space.stop.prevent="handleDeleteKeyboard" :aria-label="`Eliminar evento: ${release.title}`"
            :aria-describedby="`event-${release.id}-description`" title="Eliminar evento">
            <Trash2 class="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <span class="sr-only">Eliminar evento {{ release.title }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
