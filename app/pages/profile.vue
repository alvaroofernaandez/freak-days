<script setup lang="ts">
import { User, Edit2, Save, LogOut, Sparkles, Trophy, Calendar, Target, X, Upload, Trash2, MapPin, Globe, MessageSquare, Image as ImageIcon } from 'lucide-vue-next'
import type { UserProfile } from '@/composables/useProfile'
import type { AnimeEntry } from '@/composables/useAnime'
import type { MangaEntry } from '@/composables/useManga'
import { useAuthStore } from '~~/stores/auth'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/composables/useToast'

const profileApi = useProfile()
const auth = useAuth()
const authStore = useAuthStore()
const animeApi = useAnime()
const mangaApi = useManga()
const toast = useToast()

const profile = ref<UserProfile | null>(null)
const animeList = ref<AnimeEntry[]>([])
const mangaList = ref<MangaEntry[]>([])
const loading = ref(true)
const saving = ref(false)
const uploadingAvatar = ref(false)
const editing = ref(false)

const editForm = ref({
  username: '',
  display_name: '',
  bio: '',
  favorite_anime_id: '',
  favorite_manga_id: '',
  location: '',
  website: '',
  twitter: '',
  instagram: '',
  discord: '',
})

const avatarFileInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)

const expProgress = computed(() => {
  if (!profile.value) return { current: 0, needed: 100, progress: 0 }
  return profileApi.expForNextLevel(profile.value.totalExp)
})

const favoriteAnime = computed(() => {
  if (!profile.value?.favoriteAnimeId) return null
  return animeList.value.find(a => a.id === profile.value!.favoriteAnimeId) || null
})

const favoriteManga = computed(() => {
  if (!profile.value?.favoriteMangaId) return null
  return mangaList.value.find(m => m.id === profile.value!.favoriteMangaId) || null
})

onMounted(async () => {
  await loadProfile()
  await loadAnimeAndManga()
})

async function loadProfile() {
  loading.value = true
  try {
    profile.value = await profileApi.fetchProfile()
    if (profile.value) {
      editForm.value = {
        username: profile.value.username ?? '',
        display_name: profile.value.displayName ?? '',
        bio: profile.value.bio ?? '',
        favorite_anime_id: profile.value.favoriteAnimeId ?? '',
        favorite_manga_id: profile.value.favoriteMangaId ?? '',
        location: profile.value.location ?? '',
        website: profile.value.website ?? '',
        twitter: profile.value.socialLinks?.twitter ?? '',
        instagram: profile.value.socialLinks?.instagram ?? '',
        discord: profile.value.socialLinks?.discord ?? '',
      }
      avatarPreview.value = profile.value.avatarUrl
    }
  } finally {
    loading.value = false
  }
}

async function loadAnimeAndManga() {
  try {
    const [anime, manga] = await Promise.all([
      animeApi.fetchAnimeList(),
      mangaApi.fetchCollection()
    ])
    animeList.value = anime
    mangaList.value = manga
  } catch (error) {
    console.error('Error loading anime/manga:', error)
  }
}

function startEditing() {
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  if (profile.value) {
    editForm.value = {
      username: profile.value.username ?? '',
      display_name: profile.value.displayName ?? '',
      bio: profile.value.bio ?? '',
      favorite_anime_id: profile.value.favoriteAnimeId ?? '',
      favorite_manga_id: profile.value.favoriteMangaId ?? '',
      location: profile.value.location ?? '',
      website: profile.value.website ?? '',
      twitter: profile.value.socialLinks?.twitter ?? '',
      instagram: profile.value.socialLinks?.instagram ?? '',
      discord: profile.value.socialLinks?.discord ?? '',
    }
    avatarPreview.value = profile.value.avatarUrl
  }
}

async function saveProfile() {
  if (!editForm.value.username.trim()) {
    toast.error('El nombre de usuario es obligatorio')
    return
  }
  
  saving.value = true
  try {
    const socialLinks: Record<string, string> = {}
    if (editForm.value.twitter) socialLinks.twitter = editForm.value.twitter
    if (editForm.value.instagram) socialLinks.instagram = editForm.value.instagram
    if (editForm.value.discord) socialLinks.discord = editForm.value.discord

    const success = await profileApi.updateProfile({
      username: editForm.value.username,
      display_name: editForm.value.display_name || undefined,
      bio: editForm.value.bio || undefined,
      favorite_anime_id: editForm.value.favorite_anime_id || null,
      favorite_manga_id: editForm.value.favorite_manga_id || null,
      location: editForm.value.location || undefined,
      website: editForm.value.website || undefined,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    })
    
    if (success) {
      await loadProfile()
      editing.value = false
      toast.success('Perfil actualizado correctamente')
    } else {
      toast.error('Error al actualizar el perfil')
    }
  } finally {
    saving.value = false
  }
}

async function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('Por favor, selecciona una imagen válida')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error('La imagen no puede ser mayor a 5MB')
    return
  }

  uploadingAvatar.value = true
  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    const avatarUrl = await profileApi.uploadAvatar(file)
    if (avatarUrl) {
      await loadProfile()
      toast.success('Avatar actualizado correctamente')
    } else {
      toast.error('Error al subir el avatar')
    }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    toast.error('Error al subir el avatar')
  } finally {
    uploadingAvatar.value = false
    if (avatarFileInput.value) {
      avatarFileInput.value.value = ''
    }
  }
}

async function handleDeleteAvatar() {
  if (!confirm('¿Estás seguro de que quieres eliminar tu avatar?')) return

  uploadingAvatar.value = true
  try {
    const success = await profileApi.deleteAvatar()
    if (success) {
      avatarPreview.value = null
      await loadProfile()
      toast.success('Avatar eliminado correctamente')
    } else {
      toast.error('Error al eliminar el avatar')
    }
  } finally {
    uploadingAvatar.value = false
  }
}

function triggerAvatarUpload() {
  avatarFileInput.value?.click()
}

async function handleLogout() {
  await auth.signOut()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-xl sm:text-2xl font-bold flex items-center gap-2">
        <User class="h-6 w-6 text-primary" />
        Mi Perfil
      </h1>
      <p class="text-muted-foreground text-sm">
        Gestiona tu cuenta y estadísticas
      </p>
    </header>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>

    <template v-else-if="profile">
      <Card class="overflow-hidden">
        <div class="h-24 bg-linear-to-r from-primary/20 via-primary/10 to-exp-legendary/20 relative">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.3),transparent)]" />
        </div>
        
        <CardContent class="-mt-12 relative">
          <div class="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <div class="relative group">
              <Avatar class="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage 
                  v-if="avatarPreview" 
                  :src="avatarPreview" 
                  :alt="profile.displayName || profile.username"
                />
                <AvatarFallback class="bg-primary text-3xl text-primary-foreground">
                  {{ profile.username?.charAt(0)?.toUpperCase() ?? '?' }}
                </AvatarFallback>
              </Avatar>
              <div v-if="editing" class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-8 w-8"
                    @click="triggerAvatarUpload"
                    :disabled="uploadingAvatar"
                  >
                    <Upload class="h-4 w-4" />
                  </Button>
                  <Button
                    v-if="avatarPreview"
                    size="icon"
                    variant="destructive"
                    class="h-8 w-8"
                    @click="handleDeleteAvatar"
                    :disabled="uploadingAvatar"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <input
                ref="avatarFileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarUpload"
              />
            </div>
            
            <div class="flex-1 text-center sm:text-left space-y-1">
              <h2 class="text-2xl font-bold">
                {{ profile.displayName || profile.username }}
              </h2>
              <p class="text-muted-foreground">@{{ profile.username }}</p>
              <p v-if="profile.bio" class="text-sm text-muted-foreground mt-2">
                {{ profile.bio }}
              </p>
            </div>

            <div class="flex gap-2">
              <Button 
                v-if="!editing"
                variant="outline" 
                size="sm"
                @click="startEditing"
              >
                <Edit2 class="h-4 w-4 mr-2" />
                Editar
              </Button>
              <template v-else>
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="cancelEditing"
                >
                  <X class="h-4 w-4" />
                </Button>
                <Button 
                  size="sm"
                  @click="saveProfile"
                  :disabled="saving"
                >
                  <Save class="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </template>
            </div>
          </div>

          <div v-if="editing" class="mt-6 space-y-4 p-4 bg-muted/50 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="username">Nombre de usuario *</Label>
                <Input 
                  id="username" 
                  v-model="editForm.username" 
                  placeholder="Tu nombre de usuario"
                  class="w-full"
                />
              </div>
              <div class="space-y-2">
                <Label for="displayName">Nombre para mostrar</Label>
                <Input 
                  id="displayName" 
                  v-model="editForm.display_name" 
                  placeholder="Tu nombre público"
                  class="w-full"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="bio">Biografía</Label>
              <textarea
                id="bio"
                v-model="editForm.bio"
                placeholder="Cuéntanos sobre ti..."
                class="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="favoriteAnime">Anime Favorito</Label>
                <select
                  id="favoriteAnime"
                  v-model="editForm.favorite_anime_id"
                  class="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Ninguno</option>
                  <option v-for="anime in animeList" :key="anime.id" :value="anime.id">
                    {{ anime.title }}
                  </option>
                </select>
              </div>
              <div class="space-y-2">
                <Label for="favoriteManga">Manga Favorito</Label>
                <select
                  id="favoriteManga"
                  v-model="editForm.favorite_manga_id"
                  class="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Ninguno</option>
                  <option v-for="manga in mangaList" :key="manga.id" :value="manga.id">
                    {{ manga.title }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="location">
                  <MapPin class="h-4 w-4 inline mr-1" />
                  Ubicación
                </Label>
                <Input 
                  id="location" 
                  v-model="editForm.location" 
                  placeholder="Tu ciudad o país"
                  class="w-full"
                />
              </div>
              <div class="space-y-2">
                <Label for="website">
                  <Globe class="h-4 w-4 inline mr-1" />
                  Sitio web
                </Label>
                <Input 
                  id="website" 
                  v-model="editForm.website" 
                  placeholder="https://..."
                  type="url"
                  class="w-full"
                />
              </div>
            </div>

            <div class="space-y-3">
              <Label>Redes sociales</Label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-2">
                  <Label for="twitter" class="text-xs">Twitter/X</Label>
                  <Input 
                    id="twitter" 
                    v-model="editForm.twitter" 
                    placeholder="@usuario"
                    class="w-full"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="instagram" class="text-xs">Instagram</Label>
                  <Input 
                    id="instagram" 
                    v-model="editForm.instagram" 
                    placeholder="@usuario"
                    class="w-full"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="discord" class="text-xs">Discord</Label>
                  <Input 
                    id="discord" 
                    v-model="editForm.discord" 
                    placeholder="Usuario#1234"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="mt-6 space-y-4">
            <div v-if="profile.bio" class="p-4 bg-muted/50 rounded-lg">
              <p class="text-sm">{{ profile.bio }}</p>
            </div>

            <div v-if="favoriteAnime || favoriteManga || profile.location || profile.website || Object.keys(profile.socialLinks || {}).length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="favoriteAnime" class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <ImageIcon class="h-5 w-5 text-primary flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground">Anime Favorito</p>
                  <p class="text-sm font-medium truncate">{{ favoriteAnime.title }}</p>
                </div>
              </div>
              <div v-if="favoriteManga" class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <ImageIcon class="h-5 w-5 text-primary flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground">Manga Favorito</p>
                  <p class="text-sm font-medium truncate">{{ favoriteManga.title }}</p>
                </div>
              </div>
              <div v-if="profile.location" class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin class="h-5 w-5 text-primary flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground">Ubicación</p>
                  <p class="text-sm font-medium truncate">{{ profile.location }}</p>
                </div>
              </div>
              <div v-if="profile.website" class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Globe class="h-5 w-5 text-primary flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground">Sitio web</p>
                  <a :href="profile.website" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary hover:underline truncate block">
                    {{ profile.website }}
                  </a>
                </div>
              </div>
              <div v-if="profile.socialLinks?.twitter" class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MessageSquare class="h-5 w-5 text-primary flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground">Twitter/X</p>
                  <p class="text-sm font-medium truncate">{{ profile.socialLinks.twitter }}</p>
                </div>
              </div>
              <div v-if="profile.socialLinks?.instagram" class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MessageSquare class="h-5 w-5 text-primary flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground">Instagram</p>
                  <p class="text-sm font-medium truncate">{{ profile.socialLinks.instagram }}</p>
                </div>
              </div>
              <div v-if="profile.socialLinks?.discord" class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MessageSquare class="h-5 w-5 text-primary flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted-foreground">Discord</p>
                  <p class="text-sm font-medium truncate">{{ profile.socialLinks.discord }}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card class="text-center py-4">
          <div class="flex flex-col items-center gap-1">
            <Sparkles class="h-6 w-6 text-exp-legendary" />
            <span class="text-2xl font-bold">{{ profile.level }}</span>
            <span class="text-xs text-muted-foreground">Nivel</span>
          </div>
        </Card>
        <Card class="text-center py-4">
          <div class="flex flex-col items-center gap-1">
            <Trophy class="h-6 w-6 text-exp-medium" />
            <span class="text-2xl font-bold">{{ profile.totalExp }}</span>
            <span class="text-xs text-muted-foreground">EXP Total</span>
          </div>
        </Card>
        <Card class="text-center py-4">
          <div class="flex flex-col items-center gap-1">
            <Target class="h-6 w-6 text-primary" />
            <span class="text-2xl font-bold">{{ expProgress.current }}</span>
            <span class="text-xs text-muted-foreground">EXP Nivel</span>
          </div>
        </Card>
        <Card class="text-center py-4">
          <div class="flex flex-col items-center gap-1">
            <Calendar class="h-6 w-6 text-exp-easy" />
            <span class="text-2xl font-bold">{{ expProgress.needed - expProgress.current }}</span>
            <span class="text-xs text-muted-foreground">Para subir</span>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Progreso al siguiente nivel</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Nivel {{ profile.level }}</span>
              <span>Nivel {{ profile.level + 1 }}</span>
            </div>
            <div class="h-4 bg-muted rounded-full overflow-hidden">
              <div 
                class="h-full bg-linear-to-r from-primary via-exp-medium to-exp-legendary rounded-full transition-all duration-500"
                :style="{ width: `${expProgress.progress}%` }"
              />
            </div>
            <p class="text-center text-sm text-muted-foreground">
              {{ expProgress.current }} / {{ expProgress.needed }} EXP
            </p>
          </div>
        </CardContent>
      </Card>

      <Card class="border-destructive/30">
        <CardHeader>
          <CardTitle class="text-base text-destructive">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            class="w-full"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
