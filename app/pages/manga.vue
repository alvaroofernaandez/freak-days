<script setup lang="ts">
import { BookOpen, Plus, CheckCircle2, Heart, TrendingUp, List } from 'lucide-vue-next'
import type { MangaEntry, CreateMangaDTO } from '@/composables/useManga'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import MangaStats from '@/components/manga/MangaStats.vue'
import MangaStatsSkeleton from '@/components/manga/MangaStatsSkeleton.vue'
import MangaList from '@/components/manga/MangaList.vue'
import AddMangaModal from '@/components/manga/AddMangaModal.vue'
import { ErrorState } from '@/components/error'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useErrorHandler } from '@/composables/useErrorHandler'

const mangaApi = useManga()
const { handleError } = useErrorHandler()

const mangaCollection = ref<MangaEntry[]>([])
const loading = ref(true)
const error = ref<Error | null>(null)
const showAddModal = ref(false)

type TabValue = 'all' | 'collecting' | 'completed' | 'wishlist'

const activeTab = ref<TabValue>('all')

const tabs = [
  { value: 'all' as TabValue, label: 'Todos', icon: List },
  { value: 'collecting' as TabValue, label: 'En curso', icon: TrendingUp },
  { value: 'completed' as TabValue, label: 'Completadas', icon: CheckCircle2 },
  { value: 'wishlist' as TabValue, label: 'Wishlist', icon: Heart },
]

const filteredMangas = computed(() => {
  if (activeTab.value === 'all') {
    return mangaCollection.value
  }
  return mangaCollection.value.filter(m => m.status === activeTab.value)
})

onMounted(async () => {
  await loadManga()
})

async function loadManga() {
  loading.value = true
  error.value = null
  try {
    mangaCollection.value = await mangaApi.fetchCollection()
  } catch (err) {
    error.value = err instanceof Error ? err : new Error('Error al cargar la colección de manga')
    handleError(err, { customMessage: 'No se pudo cargar tu colección de manga' })
  } finally {
    loading.value = false
  }
}

async function addManga(dto: CreateMangaDTO) {
  try {
    const created = await mangaApi.addManga(dto)
    if (created) {
      await loadManga()
      showAddModal.value = false
    } else {
      handleError(new Error('No se pudo añadir el manga'), { customMessage: 'No se pudo añadir el manga a tu colección' })
    }
  } catch (err) {
    handleError(err, { customMessage: 'Error al añadir el manga' })
  }
}

async function handleAddVolume(id: string) {
  const manga = mangaCollection.value.find(m => m.id === id)
  if (!manga) return

  const nextVolume = manga.ownedVolumes.length > 0 
    ? Math.max(...manga.ownedVolumes) + 1 
    : 1
    
  if (manga.totalVolumes && nextVolume > manga.totalVolumes) return
  
  try {
    const success = await mangaApi.addVolume(id, nextVolume)
    if (success) {
      await loadManga()
    } else {
      handleError(new Error('No se pudo añadir el volumen'), { customMessage: 'No se pudo añadir el volumen' })
    }
  } catch (err) {
    handleError(err, { customMessage: 'Error al añadir el volumen' })
  }
}

async function handleRemoveVolume(id: string, volume: number) {
  try {
    const success = await mangaApi.removeVolume(id, volume)
    if (success) {
      await loadManga()
    } else {
      handleError(new Error('No se pudo eliminar el volumen'), { customMessage: 'No se pudo eliminar el volumen' })
    }
  } catch (err) {
    handleError(err, { customMessage: 'Error al eliminar el volumen' })
  }
}

async function handleDelete(id: string) {
  try {
    const success = await mangaApi.deleteManga(id)
    if (success) {
      await loadManga()
    } else {
      handleError(new Error('No se pudo eliminar el manga'), { customMessage: 'No se pudo eliminar el manga' })
    }
  } catch (err) {
    handleError(err, { customMessage: 'Error al eliminar el manga' })
  }
}

async function handleUpdatePrice(id: string, price: number | null) {
  try {
    const success = await mangaApi.updatePricePerVolume(id, price)
    if (success) {
      await loadManga()
    } else {
      handleError(new Error('No se pudo actualizar el precio'), { customMessage: 'No se pudo actualizar el precio' })
    }
  } catch (err) {
    handleError(err, { customMessage: 'Error al actualizar el precio' })
  }
}

async function handleUpdateStatus(id: string, status: MangaEntry['status']) {
  try {
    const success = await mangaApi.updateStatus(id, status)
    if (success) {
      await loadManga()
    } else {
      handleError(new Error('No se pudo actualizar el estado'), { customMessage: 'No se pudo actualizar el estado del manga' })
    }
  } catch (err) {
    handleError(err, { customMessage: 'Error al actualizar el estado' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <BookOpen class="h-6 w-6 text-primary" />
          Colección Manga
        </h1>
        <p class="text-muted-foreground text-sm">
          Gestiona tu biblioteca física de mangas
        </p>
      </div>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button size="icon" class="h-10 w-10 rounded-full glow-primary" @click="showAddModal = true">
            <Plus class="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Añadir manga</p>
        </TooltipContent>
      </Tooltip>
    </header>

    <MangaStatsSkeleton v-if="loading" />
    <ErrorState 
      v-else-if="error"
      :message="error.message"
      action-label="Reintentar"
      @action="loadManga"
    />
    <MangaStats v-else :mangas="mangaCollection" />

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-4">
        <TabsTrigger 
          v-for="tab in tabs" 
          :key="tab.value" 
          :value="tab.value"
          class="flex items-center gap-2"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          <span class="hidden sm:inline">{{ tab.label }}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" class="mt-4">
        <MangaList
          :mangas="filteredMangas"
          :loading="loading"
          @add-volume="handleAddVolume"
          @remove-volume="handleRemoveVolume"
          @delete="handleDelete"
          @update-price="handleUpdatePrice"
          @update-status="handleUpdateStatus"
        />
      </TabsContent>

      <TabsContent value="collecting" class="mt-4">
        <MangaList
          :mangas="filteredMangas"
          :loading="loading"
          @add-volume="handleAddVolume"
          @remove-volume="handleRemoveVolume"
          @delete="handleDelete"
          @update-price="handleUpdatePrice"
          @update-status="handleUpdateStatus"
        />
      </TabsContent>

      <TabsContent value="completed" class="mt-4">
        <MangaList
          :mangas="filteredMangas"
          :loading="loading"
          @add-volume="handleAddVolume"
          @remove-volume="handleRemoveVolume"
          @delete="handleDelete"
          @update-price="handleUpdatePrice"
          @update-status="handleUpdateStatus"
        />
      </TabsContent>

      <TabsContent value="wishlist" class="mt-4">
        <MangaList
          :mangas="filteredMangas"
          :loading="loading"
          @add-volume="handleAddVolume"
          @remove-volume="handleRemoveVolume"
          @delete="handleDelete"
          @update-price="handleUpdatePrice"
          @update-status="handleUpdateStatus"
        />
      </TabsContent>
    </Tabs>

    <AddMangaModal 
      :show="showAddModal" 
      @close="showAddModal = false"
      @submit="addManga"
    />
  </div>
</template>
