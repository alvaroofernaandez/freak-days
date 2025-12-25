# Composables - FreakDays

Documentación completa de todos los composables Vue utilizados en FreakDays. Los composables encapsulan lógica reutilizable y abstraen el acceso a datos.

## 📚 Índice

- [useSupabase](#usesupabase)
- [useAuth](#useauth)
- [useProfile](#useprofile)
- [useAnime](#useanime)
- [useAnimeSearch](#useanimesearch)
- [useManga](#usemanga)
- [useQuests](#usequests)
- [useWorkouts](#useworkouts)
- [useParties](#useparties)
- [useCalendar](#usecalendar)
- [useToast](#usetoast)
- [useErrorHandler](#useerrorhandler)

---

## useSupabase

Proporciona el cliente de Supabase configurado.

**Ubicación**: `app/composables/useSupabase.ts`

### Uso

```typescript
const supabase = useSupabase()
```

### Retorna

- `SupabaseClient`: Cliente de Supabase configurado

### Ejemplo

```typescript
const supabase = useSupabase()
const { data, error } = await supabase.from('anime_list').select('*')
```

---

## useAuth

Gestiona la autenticación del usuario.

**Ubicación**: `app/composables/useAuth.ts`

### Funciones

#### `initialize()`

Inicializa el sistema de autenticación y configura listeners.

```typescript
const auth = useAuth()
await auth.initialize()
```

#### `signUp(email: string, password: string)`

Registra un nuevo usuario.

```typescript
await auth.signUp('user@example.com', 'password123')
```

#### `signIn(email: string, password: string)`

Inicia sesión con email y contraseña.

```typescript
await auth.signIn('user@example.com', 'password123')
```

#### `signOut()`

Cierra la sesión del usuario.

```typescript
await auth.signOut()
```

### Retorna

- `initialize()`: `Promise<void>`
- `signUp()`: `Promise<void>`
- `signIn()`: `Promise<void>`
- `signOut()`: `Promise<void>`

---

## useProfile

Gestiona el perfil del usuario.

**Ubicación**: `app/composables/useProfile.ts`

### Tipos

```typescript
interface UserProfile {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  totalExp: number
  level: number
  bio: string | null
  favoriteAnimeId: string | null
  favoriteMangaId: string | null
  location: string | null
  website: string | null
  socialLinks: Record<string, string>
  createdAt: Date
  updatedAt: Date
}
```

### Funciones

#### `fetchProfile()`

Obtiene el perfil del usuario actual.

```typescript
const profileApi = useProfile()
const profile = await profileApi.fetchProfile()
```

#### `updateProfile(data: Partial<UserProfile>)`

Actualiza el perfil del usuario.

```typescript
await profileApi.updateProfile({
  displayName: 'Nuevo Nombre',
  bio: 'Mi biografía'
})
```

#### `uploadAvatar(file: File)`

Sube un avatar del usuario.

```typescript
const file = event.target.files[0]
const avatarUrl = await profileApi.uploadAvatar(file)
```

#### `deleteAvatar()`

Elimina el avatar del usuario.

```typescript
await profileApi.deleteAvatar()
```

#### `expForNextLevel(currentExp: number)`

Calcula el progreso de EXP para el siguiente nivel.

```typescript
const progress = profileApi.expForNextLevel(profile.totalExp)
// Retorna: { current: number, needed: number, progress: number }
```

### Retorna

- `fetchProfile()`: `Promise<UserProfile | null>`
- `updateProfile()`: `Promise<UserProfile | null>`
- `uploadAvatar()`: `Promise<string | null>`
- `deleteAvatar()`: `Promise<void>`
- `expForNextLevel()`: `{ current: number, needed: number, progress: number }`

---

## useAnime

Gestiona la lista de anime del usuario.

**Ubicación**: `app/composables/useAnime.ts`

### Tipos

```typescript
type AnimeStatus = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch' | 'rewatching'

interface AnimeEntry {
  id: string
  title: string
  status: AnimeStatus
  currentEpisode: number
  totalEpisodes: number | null
  score: number | null
  notes: string | null
  coverUrl: string | null
  startDate: Date | null
  endDate: Date | null
  rewatchCount: number
}

interface CreateAnimeDTO {
  title: string
  status: AnimeStatus
  total_episodes?: number
  score?: number
  cover_url?: string
  notes?: string
}
```

### Funciones

#### `fetchAnimeList()`

Obtiene toda la lista de anime del usuario.

```typescript
const animeApi = useAnime()
const animeList = await animeApi.fetchAnimeList()
```

#### `fetchByStatus(status: AnimeStatus)`

Obtiene anime filtrado por estado.

```typescript
const watching = await animeApi.fetchByStatus('watching')
```

#### `addAnime(dto: CreateAnimeDTO)`

Añade un nuevo anime a la lista.

```typescript
await animeApi.addAnime({
  title: 'One Piece',
  status: 'watching',
  total_episodes: 1000
})
```

#### `updateProgress(id: string, episode: number)`

Actualiza el progreso de episodios.

```typescript
await animeApi.updateProgress(animeId, 50)
```

#### `updateStatus(id: string, status: AnimeStatus)`

Actualiza el estado del anime.

```typescript
await animeApi.updateStatus(animeId, 'completed')
```

#### `deleteAnime(id: string)`

Elimina un anime de la lista.

```typescript
await animeApi.deleteAnime(animeId)
```

---

## useAnimeSearch

Gestiona la búsqueda de anime mediante Jikan API.

**Ubicación**: `app/composables/useAnimeSearch.ts`

### Tipos

```typescript
interface AnimeSearchResult {
  mal_id: number
  title: string
  title_english: string | null
  title_japanese: string | null
  images: {
    jpg: { image_url: string; small_image_url: string; large_image_url: string }
    webp: { image_url: string; small_image_url: string; large_image_url: string }
  }
  synopsis: string | null
  type: string
  episodes: number | null
  score: number | null
  // ... más campos
}
```

### Propiedades Reactivas

- `searching`: `Readonly<Ref<boolean>>` - Indica si hay una búsqueda en curso
- `searchResults`: `Readonly<Ref<AnimeSearchResult[]>>` - Resultados de la búsqueda
- `searchQuery`: `Readonly<Ref<string>>` - Query actual
- `hasMorePages`: `Readonly<Ref<boolean>>` - Indica si hay más páginas

### Funciones

#### `debouncedSearch(query: string)`

Busca anime con debounce automático (500ms).

```typescript
const animeSearch = useAnimeSearch()
animeSearch.debouncedSearch('One Piece')
```

#### `searchAnime(query: string, page?: number)`

Busca anime directamente.

```typescript
await animeSearch.searchAnime('Naruto', 1)
```

#### `loadMoreResults()`

Carga la siguiente página de resultados.

```typescript
await animeSearch.loadMoreResults()
```

#### `clearSearch()`

Limpia la búsqueda actual.

```typescript
animeSearch.clearSearch()
```

#### `getAnimeDetails(malId: number)`

Obtiene detalles completos de un anime.

```typescript
const details = await animeSearch.getAnimeDetails(12345)
```

---

## useManga

Gestiona la colección de manga del usuario.

**Ubicación**: `app/composables/useManga.ts`

### Tipos

```typescript
type MangaStatus = 'collecting' | 'completed' | 'dropped' | 'wishlist'

interface MangaEntry {
  id: string
  title: string
  author: string | null
  totalVolumes: number | null
  ownedVolumes: number[]
  status: MangaStatus
  score: number | null
  notes: string | null
  coverUrl: string | null
  pricePerVolume: number | null
  totalCost: number
}

interface CreateMangaDTO {
  title: string
  author?: string
  total_volumes?: number
  status?: MangaStatus
  price_per_volume?: number
}
```

### Funciones

#### `fetchCollection()`

Obtiene toda la colección de manga.

```typescript
const mangaApi = useManga()
const collection = await mangaApi.fetchCollection()
```

#### `addManga(dto: CreateMangaDTO)`

Añade un nuevo manga a la colección.

```typescript
await mangaApi.addManga({
  title: 'One Piece',
  total_volumes: 100,
  status: 'collecting',
  price_per_volume: 8.99
})
```

#### `addVolume(id: string, volume: number)`

Añade un volumen a la colección.

```typescript
await mangaApi.addVolume(mangaId, 5)
```

#### `removeVolume(id: string, volume: number)`

Elimina un volumen de la colección.

```typescript
await mangaApi.removeVolume(mangaId, 5)
```

#### `updatePricePerVolume(id: string, price: number)`

Actualiza el precio por volumen.

```typescript
await mangaApi.updatePricePerVolume(mangaId, 9.99)
```

#### `updateStatus(id: string, status: MangaStatus)`

Actualiza el estado del manga. Si se marca como 'completed', añade automáticamente todos los volúmenes faltantes.

```typescript
await mangaApi.updateStatus(mangaId, 'completed')
```

#### `deleteManga(id: string)`

Elimina un manga de la colección.

```typescript
await mangaApi.deleteManga(mangaId)
```

---

## useQuests

Gestiona las misiones diarias (quests) del usuario.

**Ubicación**: `app/composables/useQuests.ts`

### Tipos

```typescript
type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary'

interface Quest {
  id: string
  title: string
  description: string
  difficulty: QuestDifficulty
  exp: number
  status: 'pending' | 'completed' | 'failed'
  streak: number
  dueDate: Date | null
  dueTime: string | null
  reminderMinutesBefore: number | null
  createdAt: Date
  completedAt: Date | null
  isOverdue?: boolean
  isDueSoon?: boolean
}

interface CreateQuestDTO {
  title: string
  description?: string
  difficulty: QuestDifficulty
  exp_reward: number
  is_recurring?: boolean
  recurrence_pattern?: string
  due_date?: string
  due_time?: string
  reminder_minutes_before?: number
}
```

### Funciones

#### `fetchQuests()`

Obtiene todas las quests activas del usuario.

```typescript
const questsApi = useQuests()
const quests = await questsApi.fetchQuests()
```

#### `fetchTodayCompletions()`

Obtiene los IDs de las quests completadas hoy.

```typescript
const completedIds = await questsApi.fetchTodayCompletions()
```

#### `createQuest(dto: CreateQuestDTO)`

Crea una nueva quest.

```typescript
await questsApi.createQuest({
  title: 'Hacer ejercicio',
  difficulty: 'medium',
  exp_reward: 25,
  due_date: '2025-01-15'
})
```

#### `completeQuest(questId: string, streakCount?: number)`

Completa una quest y otorga EXP.

```typescript
const expEarned = await questsApi.completeQuest(questId, 1)
```

#### `deleteQuest(questId: string)`

Elimina una quest.

```typescript
await questsApi.deleteQuest(questId)
```

---

## useWorkouts

Gestiona los entrenamientos del usuario.

**Ubicación**: `app/composables/useWorkouts.ts`

### Funciones

#### `fetchWorkouts()`

Obtiene todos los entrenamientos del usuario.

```typescript
const workoutsApi = useWorkouts()
const workouts = await workoutsApi.fetchWorkouts()
```

#### `createWorkout(data: CreateWorkoutDTO)`

Crea un nuevo entrenamiento.

```typescript
await workoutsApi.createWorkout({
  name: 'Entrenamiento de piernas',
  workout_date: '2025-01-15',
  duration_minutes: 60
})
```

#### `startWorkout(workoutId: string)`

Inicia un entrenamiento (cambia status a 'in_progress').

```typescript
await workoutsApi.startWorkout(workoutId)
```

#### `completeWorkout(workoutId: string)`

Completa un entrenamiento.

```typescript
await workoutsApi.completeWorkout(workoutId)
```

---

## useParties

Gestiona los grupos/parties del usuario.

**Ubicación**: `app/composables/useParties.ts`

### Funciones

#### `fetchParties()`

Obtiene todos los parties del usuario.

```typescript
const partiesApi = useParties()
const parties = await partiesApi.fetchParties()
```

#### `createParty(data: CreatePartyDTO)`

Crea un nuevo party.

```typescript
await partiesApi.createParty({
  name: 'Mi Grupo',
  description: 'Grupo de amigos',
  max_members: 10
})
```

---

## useCalendar

Gestiona el calendario de lanzamientos.

**Ubicación**: `app/composables/useCalendar.ts`

### Funciones

#### `fetchReleases(daysAhead?: number)`

Obtiene los lanzamientos próximos.

```typescript
const calendarApi = useCalendar()
const releases = await calendarApi.fetchReleases(90) // Próximos 90 días
```

#### `createRelease(data: CreateReleaseDTO)`

Crea un nuevo lanzamiento.

```typescript
await calendarApi.createRelease({
  title: 'Nuevo episodio de One Piece',
  release_type: 'anime_episode',
  release_date: '2025-01-20'
})
```

---

## useToast

Gestiona las notificaciones toast.

**Ubicación**: `app/composables/useToast.ts`

### Funciones

#### `success(message: string)`

Muestra un toast de éxito.

```typescript
const toast = useToast()
toast.success('Operación exitosa')
```

#### `error(message: string)`

Muestra un toast de error.

```typescript
toast.error('Ha ocurrido un error')
```

#### `info(message: string)`

Muestra un toast informativo.

```typescript
toast.info('Información importante')
```

---

## useErrorHandler

Gestiona el manejo centralizado de errores.

**Ubicación**: `app/composables/useErrorHandler.ts`

### Funciones

#### `handleError(error: Error | unknown)`

Maneja un error de forma centralizada.

```typescript
const errorHandler = useErrorHandler()
try {
  // código que puede fallar
} catch (error) {
  errorHandler.handleError(error)
}
```

#### `handleAsyncError(fn: () => Promise<T>)`

Envuelve una función async para manejo automático de errores.

```typescript
await errorHandler.handleAsyncError(async () => {
  await someAsyncOperation()
})
```

---

## 🔄 Patrones Comunes

### Uso de Stores

Todos los composables que necesitan el usuario actual utilizan `useAuthStore`:

```typescript
const authStore = useAuthStore()
if (!authStore.userId) return []
```

### Manejo de Errores

Los composables lanzan errores que deben ser capturados:

```typescript
try {
  const anime = await animeApi.addAnime(dto)
} catch (error) {
  toast.error('Error al añadir anime')
}
```

### Transformación de Datos

Los composables transforman datos de Supabase a tipos TypeScript:

```typescript
function mapDbToAnime(data: any): AnimeEntry {
  return {
    id: data.id,
    title: data.title,
    // ... transformación
  }
}
```

---

**Última actualización**: Enero 2025


