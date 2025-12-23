<script setup lang="ts">
import { Tv, Plus, Play, CheckCircle2, Pause, X, Minus, Trash2 } from 'lucide-vue-next'
import type { AnimeStatus, AnimeEntry, CreateAnimeDTO } from '../composables/useAnime'

const animeApi = useAnime()

const animeList = ref<AnimeEntry[]>([])
const loading = ref(true)
const showAddModal = ref(false)

const newAnime = ref<CreateAnimeDTO>({
  title: '',
  status: 'watching',
  total_episodes: undefined,
  score: undefined
})

const statusConfig: Record<AnimeStatus, { icon: any, color: string, label: string }> = {
  watching: { icon: Play, color: 'text-primary', label: 'En curso' },
  completed: { icon: CheckCircle2, color: 'text-exp-easy', label: 'Visto' },
  on_hold: { icon: Pause, color: 'text-exp-medium', label: 'En pausa' },
  dropped: { icon: X, color: 'text-destructive', label: 'Droppeado' },
  plan_to_watch: { icon: Tv, color: 'text-muted-foreground', label: 'Pendiente' }
}

const activeTab = ref<AnimeStatus>('watching')
const tabs: AnimeStatus[] = ['watching', 'completed', 'plan_to_watch', 'on_hold']

const filteredAnime = computed(() => 
  animeList.value.filter(a => a.status === activeTab.value)
)

const stats = computed(() => ({
  watching: animeList.value.filter(a => a.status === 'watching').length,
  completed: animeList.value.filter(a => a.status === 'completed').length,
  total: animeList.value.length
}))

onMounted(async () => {
  await loadAnime()
})

async function loadAnime() {
  loading.value = true
  try {
    animeList.value = await animeApi.fetchAnimeList()
  } finally {
    loading.value = false
  }
}

async function addAnime() {
  if (!newAnime.value.title.trim()) return

  const created = await animeApi.addAnime(newAnime.value)
  if (created) {
    animeList.value.unshift(created)
    newAnime.value = { title: '', status: 'watching', total_episodes: undefined, score: undefined }
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

async function changeStatus(anime: AnimeEntry, status: AnimeStatus) {
  const success = await animeApi.updateStatus(anime.id, status)
  if (success) {
    anime.status = status
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Tv class="h-6 w-6 text-primary" />
          Anime
        </h1>
        <p class="text-muted-foreground text-sm">
          Tu lista de animes
        </p>
      </div>
      <Button size="icon" class="h-10 w-10 rounded-full glow-primary" @click="showAddModal = true">
        <Plus class="h-5 w-5" />
      </Button>
    </header>

    <div class="grid grid-cols-3 gap-3">
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-primary">{{ stats.watching }}</div>
        <div class="text-xs text-muted-foreground">En curso</div>
      </Card>
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-exp-easy">{{ stats.completed }}</div>
        <div class="text-xs text-muted-foreground">Vistos</div>
      </Card>
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-exp-legendary">{{ stats.total }}</div>
        <div class="text-xs text-muted-foreground">Total</div>
      </Card>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      <Button
        v-for="tab in tabs"
        :key="tab"
        :variant="activeTab === tab ? 'default' : 'outline'"
        size="sm"
        class="shrink-0"
        @click="activeTab = tab"
      >
        <component :is="statusConfig[tab].icon" class="h-4 w-4 mr-1" />
        {{ statusConfig[tab].label }}
      </Button>
    </div>

    <section class="space-y-3">
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>

      <Card v-for="anime in filteredAnime" :key="anime.id" class="hover:border-primary/30 transition-colors">
        <CardHeader class="flex flex-row items-center gap-3 py-3 px-4">
          <div class="w-12 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Tv class="h-6 w-6 text-muted-foreground" />
          </div>
          <div class="flex-1 min-w-0">
            <CardTitle class="text-sm font-medium truncate">{{ anime.title }}</CardTitle>
            <CardDescription class="text-xs">
              Ep. {{ anime.currentEpisode }}{{ anime.totalEpisodes ? ` / ${anime.totalEpisodes}` : '' }}
            </CardDescription>
            <div class="flex items-center gap-2 mt-1">
              <Badge :class="statusConfig[anime.status].color" variant="outline" class="text-[10px]">
                {{ statusConfig[anime.status].label }}
              </Badge>
              <span v-if="anime.score" class="text-xs text-exp-medium">★ {{ anime.score }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <Button 
              v-if="anime.status === 'watching'"
              variant="ghost" 
              size="icon" 
              class="h-8 w-8"
              @click="decrementEpisode(anime)"
              :disabled="anime.currentEpisode <= 0"
            >
              <Minus class="h-4 w-4" />
            </Button>
            <Button 
              v-if="anime.status === 'watching'"
              variant="ghost" 
              size="icon" 
              class="h-8 w-8"
              @click="incrementEpisode(anime)"
            >
              <Plus class="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-muted-foreground hover:text-destructive"
              @click="deleteAnimeEntry(anime.id)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div v-if="!loading && filteredAnime.length === 0" class="text-center py-8">
        <Tv class="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
        <p class="text-muted-foreground text-sm">No hay animes en esta categoría</p>
        <Button variant="outline" size="sm" class="mt-4" @click="showAddModal = true">
          <Plus class="h-4 w-4 mr-2" />
          Añadir anime
        </Button>
      </div>
    </section>

    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card class="w-full max-w-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Añadir Anime</CardTitle>
          <Button variant="ghost" size="icon" @click="showAddModal = false">
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="title">Título</Label>
            <Input id="title" v-model="newAnime.title" placeholder="Ej: One Piece" class="w-full" />
          </div>
          <div class="space-y-2">
            <Label for="episodes">Episodios totales (opcional)</Label>
            <Input id="episodes" v-model.number="newAnime.total_episodes" type="number" placeholder="24" class="w-full" />
          </div>
          <div class="space-y-2">
            <Label>Estado</Label>
            <div class="grid grid-cols-2 gap-2">
              <Button 
                v-for="(config, status) in statusConfig"
                :key="status"
                :variant="newAnime.status === status ? 'default' : 'outline'"
                size="sm"
                class="text-xs"
                @click="newAnime.status = status"
              >
                {{ config.label }}
              </Button>
            </div>
          </div>
          <Button class="w-full" @click="addAnime" :disabled="!newAnime.title.trim()">
            Añadir Anime
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
