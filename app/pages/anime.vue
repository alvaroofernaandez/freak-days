<script setup lang="ts">
import { Tv, Plus, Play, CheckCircle2, Pause, X, Search, BookOpen, List } from 'lucide-vue-next'
import { Empty } from '@/components/ui/empty'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { AnimeStatus, AnimeEntry, CreateAnimeDTO } from '@/composables/useAnime'
import type { AnimeSearchResult } from '@/composables/useAnimeSearch'
import { parseJikanAnimeToDTO } from '@/utils/anime-parser'
import AnimeStats from '@/components/anime/AnimeStats.vue'
import AnimeStatsSkeleton from '@/components/anime/AnimeStatsSkeleton.vue'
import AnimeCard from '@/components/anime/AnimeCard.vue'
import AnimeCardSkeleton from '@/components/anime/AnimeCardSkeleton.vue'
import AnimeMarketplace from '@/components/anime/AnimeMarketplace.vue'
import AddAnimeStatusModal from '@/components/anime/AddAnimeStatusModal.vue'

const route = useRoute()
const router = useRouter()
const animeApi = useAnime()

const animeList = ref<AnimeEntry[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const showMarketplace = ref(false)
const activeView = ref<'list' | 'marketplace'>('list')
const showStatusModal = ref(false)
const selectedAnimeForAdd = ref<AnimeSearchResult | null>(null)

const newAnime = ref<CreateAnimeDTO>({
  title: '',
  status: 'watching',
  total_episodes: undefined,
  score: undefined,
  cover_url: undefined,
})

const statusConfig: Record<AnimeStatus, { icon: any, color: string, label: string }> = {
  watching: { icon: Play, color: 'text-primary', label: 'En curso' },
  completed: { icon: CheckCircle2, color: 'text-exp-easy', label: 'Visto' },
  on_hold: { icon: Pause, color: 'text-exp-medium', label: 'En pausa' },
  dropped: { icon: X, color: 'text-destructive', label: 'Droppeado' },
  plan_to_watch: { icon: Tv, color: 'text-muted-foreground', label: 'Pendiente' }
}

type TabValue = 'all' | AnimeStatus

const activeTab = ref<TabValue>('all')
const tabs: Array<{ value: TabValue; label: string; icon: any }> = [
  { value: 'all', label: 'Todos', icon: List },
  { value: 'watching', label: 'En curso', icon: Play },
  { value: 'completed', label: 'Visto', icon: CheckCircle2 },
  { value: 'plan_to_watch', label: 'Pendiente', icon: Tv },
  { value: 'on_hold', label: 'En pausa', icon: Pause },
]

const filteredAnime = computed(() => {
  if (activeTab.value === 'all') {
    return animeList.value
  }
  return animeList.value.filter(a => a.status === activeTab.value)
})

const stats = computed(() => ({
  watching: animeList.value.filter(a => a.status === 'watching').length,
  completed: animeList.value.filter(a => a.status === 'completed').length,
  total: animeList.value.length
}))

onMounted(async () => {
  await loadAnime()
  
  const view = route.query.view as string
  const searchQuery = route.query.q as string
  
  if (view === 'marketplace') {
    setActiveView('marketplace')
  }
})

function setActiveView(view: 'list' | 'marketplace') {
  activeView.value = view
  const query: Record<string, string | string[]> = { ...route.query } as Record<string, string | string[]>
  
  if (view === 'marketplace') {
    query.view = 'marketplace'
  } else {
    delete query.view
    delete query.q
  }
  
  router.replace({ query })
}

// Removido el watch de activeView para evitar conflictos
// La URL se actualiza directamente en setActiveView y updateSearchQuery

function updateSearchQuery(query: string) {
  // Actualizar URL inmediatamente cuando se busca
  const currentQuery: Record<string, string | string[]> = { ...route.query } as Record<string, string | string[]>
  const trimmedQuery = query?.trim() || ''
  
  if (trimmedQuery) {
    currentQuery.q = trimmedQuery
    currentQuery.view = 'marketplace'
    if (activeView.value !== 'marketplace') {
      activeView.value = 'marketplace'
    }
  } else {
    delete currentQuery.q
  }
  
  // Solo actualizar si realmente cambió
  const currentQ = (route.query.q as string) || ''
  if (currentQ !== trimmedQuery) {
    router.replace({ query: currentQuery })
  }
}

async function loadAnime() {
  loading.value = true
  try {
    animeList.value = await animeApi.fetchAnimeList()
  } finally {
    loading.value = false
  }
}

const addingAnime = ref(false)

function handleAddAnimeClick(animeResult: AnimeSearchResult) {
  selectedAnimeForAdd.value = animeResult
  showStatusModal.value = true
}

async function addAnimeFromSearch(status: AnimeStatus) {
  if (!selectedAnimeForAdd.value) return
  
  if (addingAnime.value) {
    console.log('Already adding anime, skipping...')
    return
  }
  
  console.log('Starting to add anime:', selectedAnimeForAdd.value.title || selectedAnimeForAdd.value.title_english)
  addingAnime.value = true
  const toast = useToast()
  
  try {
    console.log('Parsing anime data with status:', status)
    const animeData = parseJikanAnimeToDTO(selectedAnimeForAdd.value, status)
    console.log('Parsed anime data:', animeData)
    
    if (!animeData.title || !animeData.title.trim()) {
      console.error('Title is missing')
      toast.error('El título del anime es requerido')
      addingAnime.value = false
      return
    }
    
    console.log('Calling addAnime API...')
    const created = await animeApi.addAnime(animeData)
    console.log('addAnime result:', created)

    if (created) {
      console.log('Anime added successfully, reloading list...')
      await loadAnime()
      setActiveView('list')
      activeTab.value = status
      showStatusModal.value = false
      selectedAnimeForAdd.value = null
      toast.success('Anime añadido correctamente')
    } else {
      console.error('addAnime returned null')
      toast.error('No se pudo añadir el anime')
    }
  } catch (error: any) {
    console.error('Error adding anime from search:', error)
    console.error('Error details:', {
      message: error?.message,
      error: error?.error,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    })
    const errorMessage = error?.message || error?.error?.message || 'Error al añadir el anime. Inténtalo de nuevo.'
    toast.error(errorMessage)
  } finally {
    console.log('Resetting addingAnime state')
    addingAnime.value = false
  }
}

async function addAnime() {
  if (!newAnime.value.title.trim()) return

  const created = await animeApi.addAnime(newAnime.value)
  if (created) {
    animeList.value.unshift(created)
    newAnime.value = { title: '', status: 'watching', total_episodes: undefined, score: undefined, cover_url: undefined }
    showAddModal.value = false
  }
}

async function incrementEpisode(anime: AnimeEntry) {
  const newEp = anime.currentEpisode + 1
  if (anime.totalEpisodes && newEp > anime.totalEpisodes) return
  
  const success = await animeApi.updateProgress(anime.id, newEp)
  if (success) {
    anime.currentEpisode = newEp
    if (anime.totalEpisodes && newEp === anime.totalEpisodes) {
      await animeApi.updateStatus(anime.id, 'completed')
      anime.status = 'completed'
    }
  }
}

async function decrementEpisode(anime: AnimeEntry) {
  if (anime.currentEpisode <= 0) return
  
  const newEp = anime.currentEpisode - 1
  const success = await animeApi.updateProgress(anime.id, newEp)
  if (success) {
    anime.currentEpisode = newEp
  }
}

async function deleteAnimeEntry(id: string) {
  const success = await animeApi.deleteAnime(id)
  if (success) {
    animeList.value = animeList.value.filter(a => a.id !== id)
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Tv class="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Anime
        </h1>
        <p class="text-muted-foreground text-xs sm:text-sm mt-0.5">
          Gestiona tu lista de animes
        </p>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button 
              variant="outline"
              size="lg"
              class="flex-1 sm:flex-none"
              @click="setActiveView(activeView === 'list' ? 'marketplace' : 'list')"
            >
              <Search v-if="activeView === 'list'" class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <BookOpen v-else class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span class="sm:hidden">{{ activeView === 'list' ? 'Buscar' : 'Mi Lista' }}</span>
              <span class="hidden sm:inline">{{ activeView === 'list' ? 'Buscar Animes' : 'Mi Lista' }}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{{ activeView === 'list' ? 'Buscar animes en el marketplace' : 'Ver mi lista de animes' }}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip v-if="activeView === 'list'">
          <TooltipTrigger as-child>
            <Button 
              size="lg"
              class="flex-1 sm:flex-none sm:h-10 sm:w-auto rounded-full glow-primary" 
              @click="showAddModal = true"
            >
              <Plus class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span class="sm:hidden">Añadir</span>
              <span class="hidden sm:inline">Añadir Manual</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Añadir anime manualmente</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>

    <div v-if="activeView === 'marketplace'" data-marketplace>
      <AnimeMarketplace :adding="addingAnime" @add="handleAddAnimeClick" @search="updateSearchQuery" />
    </div>

    <div v-else class="space-y-4 sm:space-y-6">
      <AnimeStatsSkeleton v-if="loading" />
      <AnimeStats 
        v-else
        :watching="stats.watching"
        :completed="stats.completed"
        :total="stats.total"
      />

      <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button
          v-for="tab in tabs"
          :key="tab.value"
          :variant="activeTab === tab.value ? 'default' : 'outline'"
          size="sm"
          class="shrink-0"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" class="h-4 w-4 mr-1" />
          {{ tab.label }}
        </Button>
      </div>

      <section class="space-y-3">
        <template v-if="loading">
          <AnimeCardSkeleton v-for="i in 3" :key="i" />
        </template>

        <Empty
          v-else-if="filteredAnime.length === 0"
          title="No hay animes en esta categoría"
          description="Añade animes desde el marketplace o manualmente"
        >
          <template #icon>
            <Tv class="h-12 w-12 text-primary/50" />
          </template>
          <template #action>
            <div class="flex gap-2">
              <Button variant="outline" size="lg" @click="setActiveView('marketplace')">
                <Search class="h-4 w-4 mr-2" />
                Buscar Animes
              </Button>
              <Button variant="outline" size="lg" @click="showAddModal = true">
                <Plus class="h-4 w-4 mr-2" />
                Añadir Manual
              </Button>
            </div>
          </template>
        </Empty>

        <div v-else class="space-y-2 sm:space-y-3">
          <AnimeCard
            v-for="anime in filteredAnime"
            :key="anime.id"
            :anime="anime"
            @increment="incrementEpisode"
            @decrement="decrementEpisode"
            @delete="deleteAnimeEntry"
          />
        </div>
      </section>
    </div>

    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <Card class="w-full max-w-md my-auto shadow-xl border-2">
        <CardHeader class="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b">
          <CardTitle class="text-lg sm:text-xl">Añadir Anime Manualmente</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            class="h-8 w-8 sm:h-9 sm:w-9 hover:bg-muted hover:text-foreground cursor-pointer" 
            @click="showAddModal = false"
          >
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4 pt-4 sm:pt-6">
          <div class="space-y-2">
            <Label for="title" class="text-sm font-medium">Título</Label>
            <Input 
              id="title" 
              v-model="newAnime.title" 
              placeholder="Ej: One Piece" 
              class="w-full h-11 text-base"
              autofocus
            />
          </div>
          <div class="space-y-2">
            <Label for="episodes" class="text-sm font-medium">Episodios totales (opcional)</Label>
            <Input 
              id="episodes" 
              v-model.number="newAnime.total_episodes" 
              type="number" 
              placeholder="24" 
              class="w-full h-11 text-base"
            />
          </div>
          <div class="space-y-2">
            <Label class="text-sm font-medium">Estado</Label>
            <div class="grid grid-cols-2 gap-2">
              <Button 
                v-for="(config, status) in statusConfig"
                :key="status"
                :variant="newAnime.status === status ? 'default' : 'outline'"
                size="sm"
                class="text-xs"
                @click="newAnime.status = status as AnimeStatus"
              >
                {{ config.label }}
              </Button>
            </div>
          </div>
          <Button 
            size="lg" 
            class="w-full h-12 text-base font-semibold mt-2" 
            @click="addAnime" 
            :disabled="!newAnime.title.trim()"
          >
            <Plus class="h-5 w-5 mr-2" />
            Añadir Anime
          </Button>
        </CardContent>
      </Card>
    </div>

    <AddAnimeStatusModal
      :anime="selectedAnimeForAdd"
      :open="showStatusModal"
      @close="showStatusModal = false"
      @confirm="addAnimeFromSearch"
    />
  </div>
</template>
