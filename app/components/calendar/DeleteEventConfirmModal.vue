<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2 } from 'lucide-vue-next'
import type { Release } from '@/composables/useCalendar'

interface Props {
  open: boolean
  release: Release | null
  isSubmitting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: [releaseId: string]
}>()
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="open && release"
          class="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-background/95 backdrop-blur-sm overflow-y-auto"
          style="pointer-events: auto;"
          @click.self="emit('close')"
          @keydown.esc="emit('close')"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <Card class="w-full max-w-md shadow-xl border-2 border-destructive/20 my-auto" @click.stop>
            <CardHeader class="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle id="delete-confirm-title" class="text-destructive text-lg sm:text-xl">
                Eliminar Evento
              </CardTitle>
              <CardDescription class="text-sm sm:text-base mt-2">
                ¿Estás seguro de que quieres eliminar "{{ release.title }}"? Esta acción no se puede deshacer.
              </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col sm:flex-row gap-2 p-4 sm:p-6 pt-0">
              <Button variant="outline" class="flex-1 min-h-[44px]" @click="emit('close')" :disabled="isSubmitting">
                Cancelar
              </Button>
              <Button variant="destructive" class="flex-1 min-h-[44px]" @click="emit('confirm', release.id)"
                :disabled="isSubmitting">
                <Trash2 v-if="!isSubmitting" class="h-4 w-4 mr-2" />
                <span v-else class="animate-spin mr-2">⏳</span>
                {{ isSubmitting ? 'Eliminando...' : 'Eliminar' }}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

