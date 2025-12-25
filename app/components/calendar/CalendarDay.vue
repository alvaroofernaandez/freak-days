<script setup lang="ts">
import { Card } from '@/components/ui/card'
import CalendarEventCard from './CalendarEventCard.vue'
import type { Release } from '@/composables/useCalendar'

interface Props {
  date: Date
  events: Release[]
  isToday: boolean
  isCurrentMonth: boolean
  isDragging: boolean
  isHovered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHovered: false,
})

const emit = defineEmits<{
  drop: [date: Date, eventId: string]
  delete: [id: string]
  dragstart: [eventId: string]
  dragend: []
  hover: [date: Date | null]
}>()

const dayNumber = computed(() => props.date.getDate())
const isWeekend = computed(() => {
  const day = props.date.getDay()
  return day === 0 || day === 6
})

const isDragOver = ref(false)

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
  
  let eventId = e.dataTransfer?.getData('text/plain')
  if (!eventId || eventId.trim() === '') {
    try {
      const jsonData = e.dataTransfer?.getData('application/json')
      if (jsonData) {
        const parsed = JSON.parse(jsonData)
        eventId = parsed.id
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  
  if (eventId && eventId.trim() !== '') {
    emit('drop', props.date, eventId)
  }
  emit('hover', null)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
    e.dataTransfer.effectAllowed = 'move'
  }
  if (!isDragOver.value) {
    isDragOver.value = true
    emit('hover', props.date)
  }
}

function handleDragLeave(e: DragEvent) {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement
  
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    isDragOver.value = false
    emit('hover', null)
  }
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (props.isDragging || e.dataTransfer?.types.includes('text/plain')) {
    isDragOver.value = true
    emit('hover', props.date)
  }
}

function handleMouseEnter() {
  if (props.isDragging) {
    emit('hover', props.date)
  }
}

function handleMouseLeave() {
  if (!isDragOver.value) {
    emit('hover', null)
  }
}
</script>

<template>
  <Card
    :class="[
      'h-[calc((100vh-200px)/6)] sm:h-[calc((100vh-220px)/6)] md:h-[calc((100vh-240px)/6)] max-h-[140px] sm:max-h-[160px] md:max-h-[180px] transition-all duration-200',
      'hover:shadow-md hover:border-primary/30 relative',
      isCurrentMonth ? 'bg-background border-border' : 'bg-muted/30 border-muted/50',
      isToday && 'ring-2 ring-primary/60 bg-primary/10 border-primary/40 shadow-md',
      isDragOver && 'bg-primary/20 ring-2 ring-primary border-primary scale-[1.02] shadow-lg z-10',
      isHovered && isDragging && !isDragOver && 'bg-primary/5 border-primary/20',
      isWeekend && isCurrentMonth && 'bg-muted/10',
      isDragging ? 'overflow-visible' : 'overflow-hidden',
    ]"
    role="gridcell"
    :aria-label="`${dayNumber} de ${date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}${events.length > 0 ? `, ${events.length} ${events.length === 1 ? 'evento' : 'eventos'}` : ''}`"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="p-1.5 sm:p-2 h-full flex flex-col" :class="isDragging ? 'overflow-visible' : 'overflow-hidden'">
      <div class="flex items-start justify-between gap-1.5 mb-1 shrink-0">
        <span
          :class="[
            'text-xs sm:text-sm md:text-base font-bold transition-colors shrink-0',
            isToday
              ? 'text-primary'
              : isCurrentMonth
                ? 'text-foreground'
                : 'text-muted-foreground/60',
          ]"
        >
          {{ dayNumber }}
        </span>
        <div
          v-if="events.length > 0"
          class="flex-1 space-y-0.5 sm:space-y-1 min-w-0"
          :class="isDragging ? 'overflow-visible' : 'overflow-hidden'"
        >
          <TransitionGroup name="event" tag="div" class="space-y-0.5 sm:space-y-1">
            <CalendarEventCard
              v-for="event in events.slice(0, 3)"
              :key="event.id"
              :release="event"
              :is-dragging="isDragging"
              @delete.stop="emit('delete', $event)"
              @dragstart="emit('dragstart', $event)"
              @dragend="emit('dragend')"
            />
          </TransitionGroup>
          <div
            v-if="events.length > 3"
            class="text-[9px] sm:text-[10px] text-muted-foreground text-center py-0.5 font-medium"
          >
            +{{ events.length - 3 }} más
          </div>
        </div>
      </div>
      <div
        v-if="events.length === 0"
        class="flex-1"
      />
    </div>
  </Card>
</template>

<style scoped>
.event-enter-active {
  transition: all 0.3s ease;
}

.event-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}

.event-leave-active {
  transition: all 0.2s ease;
}

.event-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

.event-move {
  transition: transform 0.3s ease;
}
</style>

