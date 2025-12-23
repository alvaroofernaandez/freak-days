<script setup lang="ts">
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Tv, BookOpen, Ticket, Plus, Trash2, X } from 'lucide-vue-next'
import type { Release, ReleaseType, CreateReleaseDTO } from '../composables/useCalendar'

const calendarApi = useCalendar()

const releases = ref<Release[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const currentMonth = ref(new Date())

const newRelease = ref<CreateReleaseDTO>({
  title: '',
  type: 'anime_episode',
  release_date: new Date().toISOString().split('T')[0],
  notes: ''
})

const typeConfig: Record<ReleaseType, { icon: any, color: string, label: string }> = {
  anime_episode: { icon: Tv, color: 'text-primary', label: 'Episodio Anime' },
  manga_volume: { icon: BookOpen, color: 'text-exp-easy', label: 'Tomo Manga' },
  event: { icon: Ticket, color: 'text-exp-legendary', label: 'Evento' }
}

onMounted(async () => {
  await loadReleases()
})

async function loadReleases() {
  loading.value = true
  try {
    releases.value = await calendarApi.fetchUpcoming(90)
  } finally {
    loading.value = false
  }
}

async function addRelease() {
  if (!newRelease.value.title.trim()) return

  const created = await calendarApi.addRelease(newRelease.value)
  if (created) {
    releases.value.push(created)
    releases.value.sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime())
    newRelease.value = { title: '', type: 'anime_episode', release_date: new Date().toISOString().split('T')[0], notes: '' }
    showAddModal.value = false
  }
}

async function deleteReleaseEntry(id: string) {
  const success = await calendarApi.deleteRelease(id)
  if (success) {
    releases.value = releases.value.filter(r => r.id !== id)
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function previousMonth() {
  currentMonth.value = new Date(currentMonth.value.setMonth(currentMonth.value.getMonth() - 1))
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.setMonth(currentMonth.value.getMonth() + 1))
}

const monthName = computed(() => 
  currentMonth.value.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
)

function isThisMonth(date: Date): boolean {
  return date.getMonth() === currentMonth.value.getMonth() && 
         date.getFullYear() === currentMonth.value.getFullYear()
}

const filteredReleases = computed(() => 
  releases.value.filter(r => isThisMonth(r.releaseDate))
)
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <CalendarIcon class="h-6 w-6 text-primary" />
          Calendario
        </h1>
        <p class="text-muted-foreground text-sm">
          Próximos lanzamientos y eventos
        </p>
      </div>
      <Button size="icon" class="h-10 w-10 rounded-full glow-primary" @click="showAddModal = true">
        <Plus class="h-5 w-5" />
      </Button>
    </header>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between py-3">
        <Button variant="ghost" size="icon" @click="previousMonth">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="font-medium capitalize">{{ monthName }}</span>
        <Button variant="ghost" size="icon" @click="nextMonth">
          <ChevronRight class="h-4 w-4" />
        </Button>
      </CardHeader>
    </Card>

    <section class="space-y-3">
      <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Lanzamientos de {{ monthName }}
      </h2>
      
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
      
      <Card v-for="release in filteredReleases" :key="release.id" class="hover:border-primary/30 transition-colors">
        <CardHeader class="flex flex-row items-center gap-3 py-3 px-4">
          <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <component :is="typeConfig[release.type].icon" class="h-5 w-5" :class="typeConfig[release.type].color" />
          </div>
          <div class="flex-1 min-w-0">
            <CardTitle class="text-sm font-medium">{{ release.title }}</CardTitle>
            <CardDescription class="text-xs">
              {{ typeConfig[release.type].label }} · {{ formatDate(release.releaseDate) }}
            </CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs">
              {{ formatDate(release.releaseDate) }}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-muted-foreground hover:text-destructive"
              @click="deleteReleaseEntry(release.id)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div v-if="!loading && filteredReleases.length === 0" class="text-center py-8">
        <CalendarIcon class="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
        <p class="text-muted-foreground text-sm">No hay lanzamientos este mes</p>
        <Button variant="outline" size="sm" class="mt-4" @click="showAddModal = true">
          <Plus class="h-4 w-4 mr-2" />
          Añadir lanzamiento
        </Button>
      </div>
    </section>

    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card class="w-full max-w-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Nuevo Lanzamiento</CardTitle>
          <Button variant="ghost" size="icon" @click="showAddModal = false">
            <X class="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="title">Título</Label>
            <Input id="title" v-model="newRelease.title" placeholder="Ej: One Piece Ep. 1120" class="w-full" />
          </div>
          <div class="space-y-2">
            <Label for="date">Fecha</Label>
            <Input id="date" v-model="newRelease.release_date" type="date" class="w-full" />
          </div>
          <div class="space-y-2">
            <Label>Tipo</Label>
            <div class="grid grid-cols-3 gap-2">
              <Button 
                v-for="(config, type) in typeConfig"
                :key="type"
                :variant="newRelease.type === type ? 'default' : 'outline'"
                size="sm"
                class="text-xs flex-col h-auto py-2"
                @click="newRelease.type = type"
              >
                <component :is="config.icon" class="h-4 w-4 mb-1" />
                {{ config.label.split(' ')[0] }}
              </Button>
            </div>
          </div>
          <Button class="w-full" @click="addRelease" :disabled="!newRelease.title.trim()">
            Añadir Lanzamiento
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
