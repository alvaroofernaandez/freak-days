<script setup lang="ts">
import { BookOpen, Plus, Star, Trash2, X, Minus } from 'lucide-vue-next'
import type { MangaEntry, CreateMangaDTO } from '@/composables/useManga'

const mangaApi = useManga()

const mangaCollection = ref<MangaEntry[]>([])
const loading = ref(true)
const showAddModal = ref(false)

const newManga = ref<CreateMangaDTO>({
  title: '',
  author: '',
  total_volumes: undefined,
  status: 'collecting'
})

const stats = computed(() => ({
  total: mangaCollection.value.length,
  volumes: mangaCollection.value.reduce((sum, m) => sum + m.ownedVolumes.length, 0),
  completed: mangaCollection.value.filter(m => m.status === 'completed').length
}))

onMounted(async () => {
  await loadManga()
})

async function loadManga() {
  loading.value = true
  try {
    mangaCollection.value = await mangaApi.fetchCollection()
  } finally {
    loading.value = false
  }
}

async function addManga() {
  if (!newManga.value.title.trim()) return

  const created = await mangaApi.addManga(newManga.value)
  if (created) {
    mangaCollection.value.unshift(created)
    newManga.value = { title: '', author: '', total_volumes: undefined, status: 'collecting' }
    showAddModal.value = false
  }
}

async function addVolume(manga: MangaEntry) {
  const nextVolume = manga.ownedVolumes.length > 0 
    ? Math.max(...manga.ownedVolumes) + 1 
    : 1
    
  if (manga.totalVolumes && nextVolume > manga.totalVolumes) return
  
  const success = await mangaApi.addVolume(manga.id, nextVolume)
  if (success) {
    manga.ownedVolumes.push(nextVolume)
    manga.ownedVolumes.sort((a, b) => a - b)
    
    if (manga.totalVolumes && manga.ownedVolumes.length === manga.totalVolumes) {
      manga.status = 'completed'
    }
  }
}

async function removeLastVolume(manga: MangaEntry) {
  if (manga.ownedVolumes.length === 0) return
  
  const lastVolume = Math.max(...manga.ownedVolumes)
  const success = await mangaApi.removeVolume(manga.id, lastVolume)
  if (success) {
    manga.ownedVolumes = manga.ownedVolumes.filter(v => v !== lastVolume)
  }
}

async function deleteMangaEntry(id: string) {
  const success = await mangaApi.deleteManga(id)
  if (success) {
    mangaCollection.value = mangaCollection.value.filter(m => m.id !== id)
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
          Tu biblioteca personal
        </p>
      </div>
      <Button size="icon" class="h-10 w-10 rounded-full glow-primary" @click="showAddModal = true">
        <Plus class="h-5 w-5" />
      </Button>
    </header>

    <div class="grid grid-cols-3 gap-3">
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-primary">{{ stats.total }}</div>
        <div class="text-xs text-muted-foreground">Series</div>
      </Card>
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-exp-easy">{{ stats.volumes }}</div>
        <div class="text-xs text-muted-foreground">Tomos</div>
      </Card>
      <Card class="text-center py-3">
        <div class="text-2xl font-bold text-exp-legendary">{{ stats.completed }}</div>
        <div class="text-xs text-muted-foreground">Completas</div>
      </Card>
    </div>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Tu Colección
      </h2>
      
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
      
      <Card v-for="manga in mangaCollection" :key="manga.id" class="hover:border-primary/30 transition-colors">
        <CardHeader class="flex flex-row items-center gap-3 py-3 px-4">
          <div class="w-12 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <BookOpen class="h-6 w-6 text-muted-foreground" />
          </div>
          <div class="flex-1 min-w-0">
            <CardTitle class="text-sm font-medium truncate">{{ manga.title }}</CardTitle>
            <CardDescription v-if="manga.author" class="text-xs truncate">{{ manga.author }}</CardDescription>
            <div class="flex items-center gap-2 mt-1">
              <Badge variant="outline" class="text-[10px]">
                {{ manga.ownedVolumes.length }} / {{ manga.totalVolumes ?? '?' }} tomos
              </Badge>
              <span v-if="manga.score" class="text-xs text-exp-medium flex items-center gap-0.5">
                <Star class="h-3 w-3" />
                {{ manga.score }}
              </span>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1">
            <div class="text-xs text-muted-foreground">
              {{ manga.totalVolumes ? Math.round((manga.ownedVolumes.length / manga.totalVolumes) * 100) : 0 }}%
            </div>
            <div class="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                class="h-full bg-primary rounded-full transition-all"
                :style="{ width: `${manga.totalVolumes ? (manga.ownedVolumes.length / manga.totalVolumes) * 100 : 0}%` }"
              />
            </div>
            <div class="flex items-center gap-1 mt-1">
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-7 w-7"
                @click="removeLastVolume(manga)"
                :disabled="manga.ownedVolumes.length === 0"
              >
                <Minus class="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-7 w-7"
                @click="addVolume(manga)"
              >
                <Plus class="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-7 w-7 text-muted-foreground hover:text-destructive"
                @click="deleteMangaEntry(manga.id)"
              >
                <Trash2 class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div v-if="!loading && mangaCollection.length === 0" class="text-center py-8">
        <BookOpen class="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
        <p class="text-muted-foreground text-sm">No tienes mangas en tu colección</p>
        <Button variant="outline" size="sm" class="mt-4" @click="showAddModal = true">
          <Plus class="h-4 w-4 mr-2" />
          Añadir manga
        </Button>
      </div>
    </section>

    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card class="w-full max-w-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Añadir Manga</CardTitle>
          <Button variant="ghost" size="icon" @click="showAddModal = false">
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="title">Título</Label>
            <Input id="title" v-model="newManga.title" placeholder="Ej: One Piece" class="w-full" />
          </div>
          <div class="space-y-2">
            <Label for="author">Autor (opcional)</Label>
            <Input id="author" v-model="newManga.author" placeholder="Ej: Eiichiro Oda" class="w-full" />
          </div>
          <div class="space-y-2">
            <Label for="volumes">Tomos totales (opcional)</Label>
            <Input id="volumes" v-model.number="newManga.total_volumes" type="number" placeholder="107" class="w-full" />
          </div>
          <Button class="w-full" @click="addManga" :disabled="!newManga.title.trim()">
            Añadir Manga
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
