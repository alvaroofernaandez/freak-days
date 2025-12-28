# Composables - FreakDays

Documentación completa de todos los composables Vue utilizados en FreakDays. Los composables encapsulan lógica reutilizable y abstraen el acceso a datos.

## 📚 Índice

- [Composables de Datos](#composables-de-datos)
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
- [Composables de Página](#composables-de-página)
  - [usePageData](#usepagedata)
  - [useModal](#usemodal)
  - [useIndexPage](#useindexpage)
  - [useAnimePage](#useanimepage)
  - [useMangaPage](#usemangapage)
  - [useQuestsPage](#usequestspage)
  - [useWorkoutsPage](#useworkoutspage)
  - [usePartyPage](#usepartypage)
  - [useCalendarPage](#usecalendarpage)
  - [useProfilePage](#useprofilepage)
  - [useRegisterPage](#useregisterpage)
- [Composables de Utilidad](#composables-de-utilidad)
  - [useToast](#usetoast)
  - [useErrorHandler](#useerrorhandler)
  - [usePageTransition](#usepagetransition)

---

## useSupabase

Proporciona el cliente de Supabase configurado. Se usa principalmente para:
- Autenticación (Supabase Auth)
- Storage (avatares, banners)
- Funciones RPC específicas de Supabase

**Nota**: Las operaciones CRUD de base de datos ahora usan Prisma a través de API routes. Ver `useAnime`, `useManga`, `useQuests`, `useProfile` para más detalles.

**Ubicación**: `app/composables/useSupabase.ts`

### Uso

```typescript
const supabase = useSupabase()
```

### Retorna

- `SupabaseClient`: Cliente de Supabase configurado

### Ejemplo

```typescript
// Storage
const supabase = useSupabase()
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('path/to/file', file)

// RPC Functions
const { data } = await supabase.rpc('check_overdue_quests')
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

Gestiona el perfil del usuario. Las operaciones CRUD se ejecutan a través de API routes en el servidor usando Prisma. Las operaciones de Storage (avatar/banner) usan Supabase directamente.

**Ubicación**: `app/composables/useProfile.ts`

**API Routes**: `server/api/profile/`

### Tipos

```typescript
interface UserProfile {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  bannerUrl: string | null
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

Obtiene el perfil del usuario actual. Llama a `GET /api/profile/:id`.

```typescript
const profileApi = useProfile()
const profile = await profileApi.fetchProfile()
```

#### `updateProfile(data: Partial<UserProfile>)`

Actualiza el perfil del usuario. Llama a `PUT /api/profile/:id`.

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

#### `uploadBanner(file: File)`

Sube un banner del usuario con recorte automático.

```typescript
const file = event.target.files[0]
const bannerUrl = await profileApi.uploadBanner(file)
```

**Nota**: La imagen se sube al bucket `banners` de Supabase Storage. Se recomienda usar `BannerCropModal` para recortar la imagen antes de subirla.

#### `deleteBanner()`

Elimina el banner del usuario.

```typescript
await profileApi.deleteBanner()
```

#### `expForNextLevel(currentExp: number)`

Calcula el progreso de EXP para el siguiente nivel.

```typescript
const progress = profileApi.expForNextLevel(profile.totalExp)
// Retorna: { current: number, needed: number, progress: number }
```

### Retorna

- `fetchProfile()`: `Promise<UserProfile | null>`
- `updateProfile()`: `Promise<boolean>`
- `uploadAvatar()`: `Promise<string | null>`
- `deleteAvatar()`: `Promise<boolean>`
- `uploadBanner()`: `Promise<string | null>`
- `deleteBanner()`: `Promise<boolean>`
- `expForNextLevel()`: `{ current: number, needed: number, progress: number }`

---

## useAnime

Gestiona la lista de anime del usuario. Todas las operaciones se ejecutan a través de API routes en el servidor usando Prisma.

**Ubicación**: `app/composables/useAnime.ts`

**API Routes**: `server/api/anime/`

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

Obtiene toda la lista de anime del usuario. Llama a `GET /api/anime`.

```typescript
const animeApi = useAnime()
const animeList = await animeApi.fetchAnimeList()
```

#### `fetchByStatus(status: AnimeStatus)`

Obtiene anime filtrado por estado. Llama a `GET /api/anime?status=...`.

```typescript
const watching = await animeApi.fetchByStatus('watching')
```

#### `addAnime(dto: CreateAnimeDTO)`

Añade un nuevo anime a la lista. Llama a `POST /api/anime`.

```typescript
await animeApi.addAnime({
  title: 'One Piece',
  status: 'watching',
  total_episodes: 1000
})
```

#### `updateProgress(id: string, episode: number)`

Actualiza el progreso de episodios. Llama a `PATCH /api/anime/:id`.

```typescript
await animeApi.updateProgress(animeId, 50)
```

#### `updateStatus(id: string, status: AnimeStatus)`

Actualiza el estado del anime. Llama a `PATCH /api/anime/:id`.

```typescript
await animeApi.updateStatus(animeId, 'completed')
```

#### `deleteAnime(id: string)`

Elimina un anime de la lista. Llama a `DELETE /api/anime/:id`.

```typescript
await animeApi.deleteAnime(animeId)
```

### Notas

- Todas las operaciones usan `$fetch` para llamar a API routes
- Las API routes ejecutan Prisma exclusivamente en el servidor
- Prisma nunca se expone al cliente, mejorando seguridad y bundle size

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

Gestiona la colección de manga del usuario. Todas las operaciones se ejecutan a través de API routes en el servidor usando Prisma.

**Ubicación**: `app/composables/useManga.ts`

**API Routes**: `server/api/manga/`

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

Obtiene toda la colección de manga. Llama a `GET /api/manga`.

```typescript
const mangaApi = useManga()
const collection = await mangaApi.fetchCollection()
```

#### `addManga(dto: CreateMangaDTO)`

Añade un nuevo manga a la colección. Llama a `POST /api/manga`.

```typescript
await mangaApi.addManga({
  title: 'One Piece',
  total_volumes: 100,
  status: 'collecting',
  price_per_volume: 8.99
})
```

#### `addVolume(id: string, volume: number)`

Añade un volumen a la colección. Llama a `PATCH /api/manga/:id`.

```typescript
await mangaApi.addVolume(mangaId, 5)
```

#### `removeVolume(id: string, volume: number)`

Elimina un volumen de la colección. Llama a `PATCH /api/manga/:id`.

```typescript
await mangaApi.removeVolume(mangaId, 5)
```

#### `updatePricePerVolume(id: string, price: number)`

Actualiza el precio por volumen. Llama a `PATCH /api/manga/:id`.

```typescript
await mangaApi.updatePricePerVolume(mangaId, 9.99)
```

#### `updateStatus(id: string, status: MangaStatus)`

Actualiza el estado del manga. Si se marca como 'completed', añade automáticamente todos los volúmenes faltantes. Llama a `PATCH /api/manga/:id`.

```typescript
await mangaApi.updateStatus(mangaId, 'completed')
```

#### `deleteManga(id: string)`

Elimina un manga de la colección. Llama a `DELETE /api/manga/:id`.

```typescript
await mangaApi.deleteManga(mangaId)
```

### Notas

- Todas las operaciones usan `$fetch` para llamar a API routes
- Las API routes ejecutan Prisma exclusivamente en el servidor
- Soporte completo para tipos Decimal de Prisma (precios)

---

## useQuests

Gestiona las misiones diarias (quests) del usuario. Las operaciones CRUD se ejecutan a través de API routes en el servidor usando Prisma. Las funciones RPC (`check_overdue_quests`, `check_quests_due_soon`) mantienen Supabase directamente.

**Ubicación**: `app/composables/useQuests.ts`

**API Routes**: `server/api/quests/`

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

Obtiene todas las quests activas del usuario. Llama a `GET /api/quests`.

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

Crea una nueva quest. Llama a `POST /api/quests`.

```typescript
await questsApi.createQuest({
  title: 'Hacer ejercicio',
  difficulty: 'medium',
  exp_reward: 25,
  due_date: '2025-01-15'
})
```

#### `completeQuest(questId: string, streakCount?: number)`

Completa una quest y otorga EXP usando transacciones de Prisma. Llama a `POST /api/quests/:id/complete`.

```typescript
const expEarned = await questsApi.completeQuest(questId, 1)
```

#### `deleteQuest(questId: string)`

Elimina una quest (soft delete). Llama a `PATCH /api/quests/:id`.

```typescript
await questsApi.deleteQuest(questId)
```

### Notas

- Las operaciones CRUD usan `$fetch` para llamar a API routes
- `completeQuest` usa transacciones de Prisma en el servidor para incrementar EXP
- Las funciones RPC (`check_overdue_quests`, `check_quests_due_soon`) mantienen Supabase directamente

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

### Tipos

```typescript
interface Party {
  id: string
  name: string
  description: string | null
  inviteCode: string | null
  ownerId: string
  maxMembers: number
  createdAt: Date
  members: PartyMember[]
}

interface PartyMember {
  id: string
  partyId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Date
  profile?: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}
```

### Funciones

#### `fetchUserParties()`

Obtiene todos los parties del usuario actual.

```typescript
const partiesApi = useParties()
const parties = await partiesApi.fetchUserParties()
```

#### `createParty(name: string, description?: string)`

Crea un nuevo party con código de invitación.

```typescript
const party = await partiesApi.createParty('Mi Grupo', 'Descripción opcional')
```

#### `joinByCode(inviteCode: string)`

Se une a un party mediante código de invitación.

```typescript
const success = await partiesApi.joinByCode('ABC123')
```

#### `leaveParty(partyId: string)`

Abandona un party.

```typescript
await partiesApi.leaveParty(partyId)
```

#### `regenerateInviteCode(partyId: string)`

Regenera el código de invitación de un party.

```typescript
const newCode = await partiesApi.regenerateInviteCode(partyId)
```

#### `removeMember(partyId: string, memberId: string)`

Elimina un miembro del party (solo owner/admin).

```typescript
await partiesApi.removeMember(partyId, memberId)
```

---

## useCalendar

Gestiona el calendario de lanzamientos y eventos.

**Ubicación**: `app/composables/useCalendar.ts`

### Tipos

```typescript
type ReleaseType = "anime_episode" | "manga_volume" | "event" | "movie" | "game"

interface Release {
  id: string
  title: string
  type: ReleaseType
  releaseDate: Date
  description: string | null
  url: string | null
}

interface CreateReleaseDTO {
  title: string
  type: ReleaseType
  release_date: string
  description?: string
  url?: string
}
```

### Funciones

#### `fetchReleases()`

Obtiene todos los eventos del calendario del usuario.

```typescript
const calendarApi = useCalendar()
const releases = await calendarApi.fetchReleases()
```

#### `fetchUpcoming(daysAhead?: number)`

Obtiene los eventos próximos.

```typescript
const upcoming = await calendarApi.fetchUpcoming(30) // Próximos 30 días
```

#### `addRelease(dto: CreateReleaseDTO)`

Crea un nuevo evento en el calendario.

```typescript
const release = await calendarApi.addRelease({
  title: 'One Piece Ep. 1120',
  type: 'anime_episode',
  release_date: '2025-01-20',
  description: 'Nuevo episodio',
  url: 'https://...'
})
```

#### `updateRelease(id: string, dto: Partial<CreateReleaseDTO>)`

Actualiza un evento existente (útil para drag and drop).

```typescript
await calendarApi.updateRelease(eventId, {
  release_date: '2025-01-21'
})
```

#### `deleteRelease(id: string)`

Elimina un evento del calendario.

```typescript
await calendarApi.deleteRelease(eventId)
```

#### `normalizeDate(date: Date)`

Normaliza una fecha a las 12:00 PM para evitar problemas de zona horaria.

```typescript
const normalized = calendarApi.normalizeDate(new Date())
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

## Composables de Página

Los composables de página encapsulan toda la lógica de una página específica, separando la lógica de negocio de la presentación.

### usePageData

Composable genérico para cargar datos de página con estado de carga y error.

**Ubicación**: `app/composables/usePageData.ts`

```typescript
const { data, loading, error, reload } = usePageData({
  fetcher: () => api.fetchData(),
  immediate: true,
  onError: (err) => console.error(err)
})
```

### useModal

Composable para gestionar el estado de modales.

**Ubicación**: `app/composables/useModal.ts`

```typescript
const modal = useModal()
modal.open()
modal.close()
// modal.isOpen.value es un ref<boolean>
```

### useIndexPage

Lógica de la página principal (dashboard).

**Ubicación**: `app/composables/useIndexPage.ts`

Retorna:
- `profile`: Perfil del usuario
- `modules`: Módulos habilitados
- `loading`: Estado de carga

### useAnimePage

Lógica de la página de anime.

**Ubicación**: `app/composables/useAnimePage.ts`

Retorna:
- `animeList`: Lista de anime
- `activeView`: Vista activa ('list' | 'marketplace')
- `activeTab`: Tab activo
- `filteredAnime`: Anime filtrado
- `stats`: Estadísticas
- Funciones para gestionar anime

### useMangaPage

Lógica de la página de manga.

**Ubicación**: `app/composables/useMangaPage.ts`

Retorna:
- `mangaCollection`: Colección de manga
- `activeTab`: Tab activo
- `filteredMangas`: Mangas filtrados
- Funciones para gestionar manga

### useQuestsPage

Lógica de la página de quests.

**Ubicación**: `app/composables/useQuestsPage.ts`

Retorna:
- `quests`: Quests activas
- `completedIds`: IDs de quests completadas hoy
- `notifications`: Notificaciones de quests
- Funciones para gestionar quests

### useWorkoutsPage

Lógica de la página de workouts.

**Ubicación**: `app/composables/useWorkoutsPage.ts`

Retorna:
- `workouts`: Entrenamientos completados
- `currentWorkout`: Entrenamiento en curso
- `stats`: Estadísticas semanales
- Funciones para gestionar entrenamientos

### usePartyPage

Lógica de la página de party.

**Ubicación**: `app/composables/usePartyPage.ts`

Retorna:
- `parties`: Parties del usuario
- `loading`: Estado de carga
- Modales para crear, unirse, gestionar
- Funciones para gestionar parties y miembros

### useCalendarPage

Lógica de la página de calendario.

**Ubicación**: `app/composables/useCalendarPage.ts`

Retorna:
- `releases`: Eventos del calendario (computed)
- `loading`: Estado de carga
- `modal`: Modal para añadir eventos
- `currentMonth`: Mes actual (ref)
- `newRelease`: Formulario de nuevo evento (ref)
- `monthName`: Nombre del mes formateado (computed)
- `formatDate`: Función para formatear fechas
- `addRelease`: Función para añadir evento
- `updateEventDate`: Función para actualizar fecha (drag and drop)
- `deleteReleaseEntry`: Función para eliminar evento
- `updateReleaseEntry`: Función para actualizar evento completo
- `handleDaySheetAddEvent`: Función para añadir evento desde DayEventsSheet

### useProfilePage

Lógica de la página de perfil.

**Ubicación**: `app/composables/useProfilePage.ts`

Retorna:
- `profile`: Perfil del usuario (computed)
- `loading`: Estado de carga
- `saving`: Estado de guardado
- `savingModules`: Estado de guardado de módulos
- `modulesSaved`: Confirmación de módulos guardados
- `uploadingAvatar`: Estado de subida de avatar
- `uploadingBanner`: Estado de subida de banner
- `editing`: Modo edición (ref)
- `confirmDialog`: Modal de confirmación
- `moduleToDisable`: Módulo a deshabilitar
- `editForm`: Formulario de edición (ref)
- `avatarFileInput`: Ref del input de avatar
- `avatarPreview`: Preview del avatar (ref)
- `bannerFileInput`: Ref del input de banner
- `bannerPreview`: Preview del banner (ref)
- `expProgress`: Progreso de EXP (computed)
- `favoriteAnime`: Anime favorito (computed)
- `favoriteManga`: Manga favorito (computed)
- `modules`: Módulos del usuario (computed)
- `animeList`: Lista de anime (ref)
- `mangaList`: Lista de manga (ref)
- `startEditing`: Función para iniciar edición
- `cancelEditing`: Función para cancelar edición
- `saveProfile`: Función para guardar perfil
- `handleAvatarUpload`: Función para subir avatar
- `handleDeleteAvatar`: Función para eliminar avatar
- `triggerAvatarUpload`: Función para abrir selector de avatar
- `handleBannerUpload`: Función para subir banner
- `handleDeleteBanner`: Función para eliminar banner
- `triggerBannerUpload`: Función para abrir selector de banner
- `handleLogout`: Función para cerrar sesión
- `handleToggleModule`: Función para toggle de módulo
- `confirmDisable`: Función para confirmar deshabilitación
- `cancelDisable`: Función para cancelar deshabilitación
- `handleDisableAll`: Función para deshabilitar todos los módulos
- `initialize`: Función para inicializar la página

### useRegisterPage

Lógica de la página de registro.

**Ubicación**: `app/composables/useRegisterPage.ts`

Retorna:
- `form`: Formulario de registro
- `passwordStrength`: Fortaleza de contraseña
- `strengthLabel`: Etiqueta de fortaleza
- `strengthColor`: Color de fortaleza
- `isSubmitting`: Estado de envío
- Funciones para registro y validación

### usePageTransition

Composable para transiciones de página.

**Ubicación**: `app/composables/usePageTransition.ts`

```typescript
const { transition } = usePageTransition()
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


