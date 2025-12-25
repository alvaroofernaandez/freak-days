# Integración de APIs - FreakDays

Documentación sobre las integraciones con APIs externas y servicios utilizados en FreakDays.

## 📚 Índice

- [Supabase](#supabase)
- [Jikan API (MyAnimeList)](#jikan-api-myanimelist)
- [Autenticación](#autenticación)
- [Storage](#storage)
- [Manejo de Errores](#manejo-de-errores)

---

## Supabase

Supabase es el backend principal de FreakDays, proporcionando base de datos PostgreSQL, autenticación y almacenamiento.

### Configuración

**Variables de entorno:**

```env
SUPABASE_URL=tu_proyecto_url
SUPABASE_ANON_KEY=tu_anon_key
```

**Composable:**

```typescript
// app/composables/useSupabase.ts
const supabase = useSupabase()
```

### Base de Datos

#### Conexión

```typescript
const supabase = useSupabase()
const { data, error } = await supabase
  .from('anime_list')
  .select('*')
  .eq('user_id', userId)
```

#### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Las políticas garantizan que:

- Los usuarios solo ven sus propios datos
- Los usuarios solo modifican sus propios datos
- Las relaciones respetan las políticas de las tablas padre

**Ejemplo de política:**

```sql
CREATE POLICY "Users can manage own anime" ON public.anime_list
    FOR ALL USING (auth.uid() = user_id);
```

#### Queries Comunes

**Select con filtros:**

```typescript
const { data } = await supabase
  .from('anime_list')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'watching')
  .order('updated_at', { ascending: false })
```

**Insert:**

```typescript
const { data, error } = await supabase
  .from('anime_list')
  .insert({
    user_id: userId,
    title: 'One Piece',
    status: 'watching'
  })
  .select()
  .single()
```

**Update:**

```typescript
const { error } = await supabase
  .from('anime_list')
  .update({ current_episode: 50 })
  .eq('id', animeId)
```

**Delete:**

```typescript
const { error } = await supabase
  .from('anime_list')
  .delete()
  .eq('id', animeId)
```

### Autenticación

Ver sección [Autenticación](#autenticación) para más detalles.

### Storage

Ver sección [Storage](#storage) para más detalles.

---

## Jikan API (MyAnimeList)

Jikan API proporciona datos de anime y manga desde MyAnimeList.

### Endpoint Base

```
https://api.jikan.moe/v4
```

### Búsqueda de Anime

**Endpoint:**

```
GET /anime?q={query}&limit={limit}&page={page}
```

**Implementación:**

```typescript
// app/composables/useAnimeSearch.ts
const response = await fetch(
  `${JIKAN_API_BASE}/anime?q=${encodeURIComponent(query)}&limit=20&page=${page}`,
  { signal: abortController.signal }
)
```

**Parámetros:**
- `q`: Query de búsqueda
- `limit`: Resultados por página (máx 25)
- `page`: Número de página

**Respuesta:**

```typescript
interface AnimeSearchResponse {
  data: AnimeSearchResult[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
  }
}
```

### Detalles de Anime

**Endpoint:**

```
GET /anime/{id}/full
```

**Implementación:**

```typescript
const response = await fetch(`${JIKAN_API_BASE}/anime/${malId}/full`)
const data = await response.json()
```

### Optimizaciones

#### Debouncing

Las búsquedas tienen debounce de 500ms para reducir requests:

```typescript
const DEBOUNCE_DELAY = 500

function debouncedSearch(query: string) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    searchAnime(query, 1)
  }, DEBOUNCE_DELAY)
}
```

#### AbortController

Cancela requests anteriores cuando se inicia una nueva búsqueda:

```typescript
if (abortController) {
  abortController.abort()
}
const currentAbortController = new AbortController()
abortController = currentAbortController

const response = await fetch(url, {
  signal: currentAbortController.signal
})
```

#### Paginación

Carga resultados adicionales bajo demanda:

```typescript
async function loadMoreResults() {
  if (!hasMorePages.value || searching.value) return
  const nextPage = currentPage.value + 1
  await searchAnime(searchQuery.value, nextPage)
}
```

### Parsing de Datos

Los datos de Jikan se parsean a formato interno:

```typescript
// app/utils/anime-parser.ts
export function parseJikanAnime(data: AnimeSearchResult): CreateAnimeDTO {
  return {
    title: data.title,
    total_episodes: data.episodes,
    cover_url: data.images.jpg.large_image_url,
    notes: formatNotes(data.synopsis, data.genres, data.studios),
    // ...
  }
}
```

---

## Autenticación

### Supabase Auth

FreakDays utiliza Supabase Auth para autenticación.

#### Inicialización

```typescript
// app/composables/useAuth.ts
async function initialize() {
  const { data: { session } } = await supabase.auth.getSession()
  authStore.setSession(session)
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    authStore.setSession(session)
    // Manejar cambios de estado
  })
}
```

#### Registro

```typescript
async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (data.user) {
    await ensureProfileExists(data.user.id, email)
  }
}
```

#### Login

```typescript
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
}
```

#### Logout

```typescript
async function signOut() {
  await supabase.auth.signOut()
  authStore.setSession(null)
  navigateTo('/login')
}
```

#### Sesión

La sesión se gestiona en el store de Pinia:

```typescript
// stores/auth.ts
const session = ref<Session | null>(null)

const isAuthenticated = computed(() => !!session.value)
const userId = computed(() => session.value?.user?.id ?? null)
```

### Middleware de Autenticación

El middleware `auth.global.ts` protege todas las rutas:

```typescript
// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo('/login')
  }
})
```

---

## Storage

Supabase Storage se utiliza para almacenar avatares de usuario.

### Configuración

**Bucket:** `avatars` (público)

**Ruta:** `public/avatars/{userId}/{filename}`

### Subir Avatar

```typescript
// app/composables/useProfile.ts
async function uploadAvatar(file: File): Promise<string | null> {
  const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`
  const filePath = `public/avatars/${fileName}`
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })
  
  if (uploadError) throw uploadError
  
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}
```

### Eliminar Avatar

```typescript
async function deleteAvatar() {
  if (!profile.value?.avatarUrl) return
  
  const fileName = profile.value.avatarUrl.split('/').pop()
  const filePath = `public/avatars/${fileName}`
  
  await supabase.storage
    .from('avatars')
    .remove([filePath])
}
```

### Políticas RLS de Storage

```sql
-- Permitir lectura pública
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir upload solo al propio usuario
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir actualización solo al propio usuario
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Manejo de Errores

### Errores de Supabase

```typescript
const { data, error } = await supabase.from('anime_list').select('*')

if (error) {
  console.error('Supabase error:', error)
  throw new Error(error.message)
}
```

### Errores de API Externa

```typescript
try {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  if (error.name === 'AbortError') {
    // Request cancelado, ignorar
    return
  }
  console.error('API error:', error)
  throw error
}
```

### Manejo Centralizado

```typescript
// app/composables/useErrorHandler.ts
export function useErrorHandler() {
  const toast = useToast()
  
  function handleError(error: Error | unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    toast.error(message)
    console.error('Error:', error)
  }
  
  return { handleError }
}
```

### Tipos de Error

```typescript
// app/utils/error-handling.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

---

## 🔄 Rate Limiting

### Jikan API

Jikan API tiene límites de rate:

- **3 requests por segundo**
- **60 requests por minuto**

**Implementación:**

- Debouncing en búsquedas (500ms)
- AbortController para cancelar requests duplicados
- Paginación para evitar cargar demasiados datos

### Supabase

Supabase tiene límites según el plan:

- **Free tier**: 500MB de base de datos, 1GB de storage
- **Pro tier**: Límites más altos

---

## 📝 Notas

- Todas las llamadas a Supabase respetan RLS
- Las búsquedas de Jikan tienen debounce y cancelación
- Los errores se manejan centralizadamente
- El storage de avatares es público pero con políticas RLS

---

**Última actualización**: Enero 2025


