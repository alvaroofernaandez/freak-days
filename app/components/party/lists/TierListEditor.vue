<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/composables/useToast'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '~~/stores/auth'
import { Plus, Save, Trash2, LayoutGrid, AlertCircle } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import draggable from 'vuedraggable'
import type { PartySharedList, Tier, TierItem, TierListState } from '~~/domain/types/party'

const props = defineProps<{
  list: PartySharedList
  partyId: string
}>()

const toast = useToast()
const authStore = useAuthStore()
const isSaving = ref(false)
const isDragging = ref(false)

const TIER_COLORS = ['#FF7F7F', '#FFBF7F', '#FFFF7F', '#7FFF7F', '#7FFFFF', '#7F7FFF', '#FF7FFF']

const tiers = ref<Tier[]>([])
const pool = ref<TierItem[]>([])
const newItemText = ref('')

const totalItems = computed(() => {
  const tierItems = tiers.value.reduce((sum, tier) => sum + tier.items.length, 0)
  return tierItems + pool.value.length
})

const isEmpty = computed(() => totalItems.value === 0)

const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024
})

onMounted(() => {
  if (props.list.content) {
    const content = props.list.content as TierListState
    tiers.value = content.tiers || []
    pool.value = content.pool || []
  }

  if (tiers.value.length === 0) {
    tiers.value = [
      { id: 's', name: 'S', color: '#FF7F7F', items: [] },
      { id: 'a', name: 'A', color: '#FFBF7F', items: [] },
      { id: 'b', name: 'B', color: '#FFFF7F', items: [] },
      { id: 'c', name: 'C', color: '#7FFF7F', items: [] },
    ]
  }
})

async function save() {
  if (isSaving.value) return
  
  isSaving.value = true
  try {
    const token = await getAuthToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const content: TierListState = {
      tiers: tiers.value,
      pool: pool.value
    }

    await $fetch(`/api/party/lists/${props.list.id}`, {
      method: 'PUT',
      body: { content },
      credentials: 'include',
      headers,
    })
    toast.success('Tier List guardada exitosamente')
  } catch (e: any) {
    console.error('Error saving tier list:', e)
    toast.error(e.message || 'Error al guardar la tier list')
  } finally {
    isSaving.value = false
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = useSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch {
    return null
  }
}

function addItem() {
  if (!newItemText.value.trim()) {
    toast.info('Escribe un nombre para el item')
    return
  }
  
  pool.value.push({
    id: crypto.randomUUID(),
    content: newItemText.value.trim(),
    type: 'text'
  })
  newItemText.value = ''
}

function removeItem(id: string) {
  const poolIndex = pool.value.findIndex(i => i.id === id)
  if (poolIndex !== -1) {
    pool.value.splice(poolIndex, 1)
    toast.info('Item eliminado')
    return
  }
  
  for (const tier of tiers.value) {
    const idx = tier.items.findIndex(i => i.id === id)
    if (idx !== -1) {
      tier.items.splice(idx, 1)
      toast.info('Item eliminado del tier')
      return
    }
  }
}

function handleDragStart() {
  isDragging.value = true
}

function handleDragEnd() {
  isDragging.value = false
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6" role="main" aria-label="Editor de Tier List">
    <!-- Header with Save Button -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-card border rounded-lg p-4 sm:p-5 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <LayoutGrid class="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 class="font-semibold text-base sm:text-lg">Editor de Tier List</h3>
          <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Arrastra items entre tiers o desde el pool
          </p>
        </div>
      </div>
      <Button @click="save" :disabled="isSaving" class="min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        aria-label="Guardar cambios en la tier list">
        <Save v-if="!isSaving" class="h-4 w-4 mr-2" aria-hidden="true" />
        <span v-else class="animate-spin mr-2 inline-block" role="status" aria-label="Guardando">⏳</span>
        {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
      </Button>
    </div>

    <!-- Tiers -->
    <div class="space-y-1 bg-background rounded-lg overflow-hidden border shadow-sm" role="region"
      aria-label="Tiers de clasificación">
      <div v-for="(tier, tierIndex) in tiers" :key="tier.id"
        class="flex flex-col sm:flex-row min-h-[120px] sm:min-h-[100px] border-b last:border-0 relative group/tier hover:bg-muted/5 transition-colors"
        role="group" :aria-label="`Tier ${tier.name}`">
        <!-- Tier Header -->
        <div
          class="w-full sm:w-20 md:w-32 flex items-center justify-center p-3 sm:p-2 font-bold text-xl sm:text-2xl text-black select-none shrink-0 border-b sm:border-b-0 sm:border-r border-border/50"
          :style="{ backgroundColor: tier.color }" role="banner" :aria-label="`Tier ${tier.name}`">
          <span class="drop-shadow-sm">{{ tier.name }}</span>
        </div>

        <!-- Drop Zone -->
        <div class="flex-1 bg-muted/20 p-3 sm:p-2 min-h-[80px]" role="region"
          :aria-label="`Zona de drop para tier ${tier.name}`">
          <draggable v-model="tier.items" group="tierlist" item-key="id"
            :disabled="isMobile"
            @start="handleDragStart"
            @end="handleDragEnd"
            class="flex flex-wrap gap-2 h-full min-h-[60px]"
            :class="{ 'pointer-events-none': isMobile }">
            <template #item="{ element }">
              <div
                class="relative group/item cursor-grab active:cursor-grabbing bg-card border rounded-lg p-2.5 sm:p-2 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0"
                :class="{ 'opacity-50': isDragging }"
                role="button"
                :aria-label="`Item: ${element.content}. Arrastra para mover o presiona para eliminar`"
                tabindex="0"
                @keydown.enter="removeItem(element.id)"
                @keydown.delete="removeItem(element.id)">
                <span class="pr-7 sm:pr-6 block text-sm font-medium break-words">{{ element.content }}</span>
                <button
                  class="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 opacity-0 group-hover/item:opacity-100 group-focus/item:opacity-100 p-1.5 sm:p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-opacity min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
                  @click.stop="removeItem(element.id)"
                  :aria-label="`Eliminar item: ${element.content}`">
                  <Trash2 class="h-3.5 w-3.5 sm:h-3 sm:w-3" aria-hidden="true" />
                </button>
              </div>
            </template>
            <template #empty>
              <div class="flex items-center justify-center h-full min-h-[60px] text-xs text-muted-foreground italic"
                role="status">
                Arrastra items aquí
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <!-- Pool Section -->
    <div class="bg-card border rounded-lg p-4 sm:p-5 space-y-4 shadow-sm" role="region"
      aria-label="Items sin clasificar">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold text-base sm:text-lg flex items-center gap-2">
          <LayoutGrid class="h-4 w-4 text-primary" aria-hidden="true" />
          Items Sin Clasificar
        </h4>
        <span class="text-xs sm:text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium"
          role="status" :aria-label="`${pool.length} items sin clasificar`">
          {{ pool.length }}
        </span>
      </div>

      <div class="flex flex-col sm:flex-row gap-2" role="group" aria-label="Añadir nuevo item">
        <div class="flex-1 space-y-1.5">
          <Label for="new-item-input" class="text-xs text-muted-foreground sr-only">
            Nombre del nuevo item
          </Label>
          <Input id="new-item-input" v-model="newItemText" placeholder="Escribe el nombre del item..."
            class="w-full min-h-[44px] sm:min-h-0" maxlength="100" aria-describedby="new-item-helper"
            @keydown.enter.prevent="addItem()" />
          <p id="new-item-helper" class="text-xs text-muted-foreground">
            Presiona Enter o el botón para añadir
          </p>
        </div>
        <Button @click="addItem" variant="secondary" class="min-h-[44px] sm:min-h-0 shrink-0"
          :disabled="!newItemText.trim()" aria-label="Añadir item a la lista">
          <Plus class="h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span class="hidden sm:inline">Añadir</span>
        </Button>
      </div>

      <div
        class="min-h-[120px] sm:min-h-[100px] p-4 bg-muted/30 rounded-lg border-2 border-dashed transition-colors"
        :class="{ 'border-primary/30 bg-primary/5': pool.length === 0 }"
        role="region" aria-label="Pool de items sin clasificar">
        <div v-if="pool.length === 0"
          class="flex flex-col items-center justify-center h-full min-h-[100px] text-center text-muted-foreground"
          role="status">
          <AlertCircle class="h-8 w-8 mb-2 opacity-50" aria-hidden="true" />
          <p class="text-sm font-medium">No hay items sin clasificar</p>
          <p class="text-xs mt-1">Añade items usando el campo de arriba</p>
        </div>
        <draggable v-else v-model="pool" group="tierlist" item-key="id"
          :disabled="isMobile"
          @start="handleDragStart"
          @end="handleDragEnd"
          class="flex flex-wrap gap-2"
          :class="{ 'pointer-events-none': isMobile }">
          <template #item="{ element }">
            <div
              class="relative group/item cursor-grab active:cursor-grabbing bg-card border rounded-lg p-2.5 sm:p-2 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0"
              :class="{ 'opacity-50': isDragging }"
              role="button"
              :aria-label="`Item: ${element.content}. Arrastra para mover a un tier o presiona para eliminar`"
              tabindex="0"
              @keydown.enter="removeItem(element.id)"
              @keydown.delete="removeItem(element.id)">
              <span class="pr-7 sm:pr-6 block text-sm font-medium break-words">{{ element.content }}</span>
              <button
                class="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 opacity-0 group-hover/item:opacity-100 group-focus/item:opacity-100 p-1.5 sm:p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-opacity min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
                @click.stop="removeItem(element.id)"
                :aria-label="`Eliminar item: ${element.content}`">
                <Trash2 class="h-3.5 w-3.5 sm:h-3 sm:w-3" aria-hidden="true" />
              </button>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="isEmpty"
      class="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20 flex flex-col items-center gap-3"
      role="status" aria-live="polite">
      <LayoutGrid class="h-12 w-12 text-muted-foreground opacity-50" aria-hidden="true" />
      <div>
        <p class="font-medium text-base">Tu tier list está vacía</p>
        <p class="text-sm text-muted-foreground mt-1">Añade items usando el campo de arriba para empezar</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sortable-ghost {
  opacity: 0.4;
  background: var(--muted);
  transform: scale(0.95);
}

.sortable-drag {
  opacity: 0.8;
  transform: rotate(2deg);
}

@media (max-width: 1023px) {
  .sortable-ghost,
  .sortable-drag {
    opacity: 1;
    transform: none;
  }
}
</style>
