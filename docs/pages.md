# Páginas y Rutas - FreakDays

Documentación de todas las páginas y rutas de la aplicación FreakDays.

## 📚 Índice

- [Rutas Públicas](#rutas-públicas)
- [Rutas Protegidas](#rutas-protegidas)
- [Rutas de Error](#rutas-de-error)
- [Middleware](#middleware)

---

## Rutas Públicas

### `/` (index)

**Archivo**: `app/pages/index.vue`

Dashboard principal de la aplicación.

**Características:**
- Muestra bienvenida personalizada
- Tarjeta de perfil con nivel y EXP
- Estadísticas rápidas (quests, anime, workouts)
- Grid de módulos disponibles
- Prompt de configuración si es necesario

**Componentes utilizados:**
- `WelcomeSection`
- `ProfileCard`
- `ModuleGrid`
- `SettingsPrompt`
- `LoadingSpinner`

**Datos cargados:**
- Perfil del usuario
- Módulos habilitados
- Estadísticas rápidas

---

### `/login`

**Archivo**: `app/pages/login.vue`

Página de inicio de sesión.

**Características:**
- Formulario de login
- Validación de campos
- Manejo de errores
- Redirección automática si ya está autenticado

**Funcionalidad:**
- Usa `useAuth().signIn()`
- Redirige a `/` o `/onboarding` después del login

---

### `/register`

**Archivo**: `app/pages/register.vue`

Página de registro.

**Características:**
- Formulario de registro con validación
- Indicador de fortaleza de contraseña
- Confirmación de contraseña
- Manejo de errores
- Botón de inicio de sesión con Google
- Mensaje de éxito después del registro

**Componentes utilizados:**
- `RegisterHeader`
- `RegisterForm`
- `PasswordStrengthIndicator`
- `GoogleSignInButton`
- `RegisterSuccessMessage`

**Funcionalidad:**
- Usa `useRegisterPage()` composable
- Validación en tiempo real de contraseña
- Crea perfil automáticamente
- Redirige a `/onboarding` después del registro

---

## Rutas Protegidas

Todas las rutas protegidas requieren autenticación. El middleware `auth.global.ts` redirige a `/login` si el usuario no está autenticado.

### `/onboarding`

**Archivo**: `app/pages/onboarding.vue`

Página de configuración inicial.

**Características:**
- Selección de módulos iniciales
- Grid de módulos con descripciones
- Guardado de preferencias
- Redirección a `/` después de completar

**Funcionalidad:**
- Permite habilitar/deshabilitar módulos
- Guarda en `user_modules`
- Marca onboarding como completado

---

### `/anime`

**Archivo**: `app/pages/anime.vue`

Página principal del módulo de anime.

**Características:**
- Vista de lista y marketplace
- Estadísticas de anime
- Filtros por estado (All, Watching, Completed, etc.)
- Búsqueda con Jikan API
- Añadir anime desde marketplace

**Componentes utilizados:**
- `AnimeStats`
- `AnimeCard`
- `AnimeMarketplace`
- `AnimeSearchBar`
- `AnimeSearchCard`
- `AddAnimeStatusModal`
- `Empty`
- Skeleton loaders

**Funcionalidad:**
- Carga lista de anime del usuario
- Permite buscar y añadir nuevos animes
- Filtra por estado
- Persiste búsqueda en URL

---

### `/manga`

**Archivo**: `app/pages/manga.vue`

Página principal del módulo de manga.

**Características:**
- Estadísticas de colección
- Lista de mangas con filtros
- Gestión de volúmenes
- Tracking de costos
- Wishlist

**Componentes utilizados:**
- `MangaStats`
- `MangaList`
- `MangaCard`
- `AddMangaModal`
- `Empty`
- Skeleton loaders

**Funcionalidad:**
- Carga colección de manga
- Filtra por estado (All, Collecting, Completed, Wishlist)
- Permite añadir/eliminar volúmenes
- Calcula costos automáticamente
- Marca como completado añadiendo todos los volúmenes

---

### `/quests`

**Archivo**: `app/pages/quests.vue`

Página principal del módulo de quests.

**Características:**
- Estadísticas de quests
- Lista de quests activas
- Banner de quests vencidas
- Panel de notificaciones
- Crear/editar quests
- Completar quests

**Componentes utilizados:**
- `QuestStats`
- `QuestList`
- `QuestCard`
- `QuestFormModal`
- `OverdueBanner`
- `NotificationPanel`
- `Empty`
- Skeleton loaders

**Funcionalidad:**
- Carga quests activas
- Muestra quests completadas hoy
- Detecta quests vencidas y próximas a vencer
- Permite crear, editar y eliminar quests
- Otorga EXP al completar

---

### `/workouts`

**Archivo**: `app/pages/workouts.vue`

Página principal del módulo de workouts.

**Características:**
- Estadísticas de entrenamientos
- Lista de entrenamientos
- Iniciar nuevo entrenamiento
- Ver detalles de entrenamientos
- Entrenamientos en curso

**Componentes utilizados:**
- `WorkoutStats`
- `WorkoutList`
- `WorkoutCard`
- `StartWorkoutModal`
- `ActiveWorkoutModal`
- `WorkoutDetailModal`
- `Empty`
- Skeleton loaders

**Funcionalidad:**
- Carga entrenamientos del usuario
- Permite crear nuevos entrenamientos
- Gestiona entrenamientos en curso
- Muestra estadísticas detalladas

---

### `/party`

**Archivo**: `app/pages/party.vue`

Página principal del módulo de party system.

**Características:**
- Lista de parties del usuario con diseño responsive
- Crear nuevo party con modal
- Unirse a party por código de invitación
- Gestionar miembros (añadir, eliminar, roles)
- Regenerar códigos de invitación
- Abandonar parties
- Estado vacío mejorado
- Diseño mobile-first y responsive

**Componentes utilizados:**
- `PartyCard`
- `PartyEmptyState`
- `CreatePartyModal`
- `JoinPartyModal`
- `PartyDetailsModal`
- `DeletePartyConfirmModal`
- `RemoveMemberConfirmModal`

**Funcionalidad:**
- Usa `usePartyPage()` composable
- Carga parties del usuario con miembros
- Permite crear parties con nombre y descripción
- Genera códigos de invitación únicos
- Gestiona roles (owner, admin, member)
- Permite abandonar o eliminar parties
- Diseño responsive con adaptación móvil/desktop

---

### `/calendar`

**Archivo**: `app/pages/calendar.vue`

Página del calendario de lanzamientos con drag and drop.

**Características:**
- Vista de calendario mensual completo
- Grid de días con eventos
- Drag and drop para mover eventos entre días
- Añadir eventos personalizados
- Tipos de eventos: anime_episode, manga_volume, event, movie, game
- Navegación entre meses
- Diseño mobile-first y responsive
- Normalización de fechas para evitar problemas de zona horaria

**Componentes utilizados:**
- `CalendarGrid`
- `CalendarDay`
- `CalendarEventCard`
- `CalendarEmptyState`
- `DatePicker`
- `Button`, `Card`, `Input`, `Label`

**Funcionalidad:**
- Usa `useCalendarPage()` composable
- Carga todos los eventos del usuario
- Permite añadir eventos con título, fecha, tipo, descripción y URL
- Drag and drop funcional para cambiar fechas
- Actualización automática al mover eventos
- Eliminación de eventos
- Vista optimizada para viewport (no requiere scroll en desktop)
- Mini cards compactas dentro de cada día

---

### `/profile`

**Archivo**: `app/pages/profile.vue`

Página de perfil del usuario.

**Características:**
- Información del perfil con diseño modular
- Edición de datos con formulario
- Subida y eliminación de avatar
- Estadísticas personales (quests, anime, workouts, manga)
- Progreso de EXP y nivel con barra visual
- Tarjetas informativas (bio, ubicación, enlaces sociales)
- Diseño responsive

**Componentes utilizados:**
- `ProfileHeader`
- `ProfileEditForm`
- `ProfileStats`
- `ProfileProgressCard`
- `ProfileInfoCards`
- `Avatar`, `Progress`, `Button`, `Input`

**Funcionalidad:**
- Usa `useProfilePage()` composable
- Carga perfil del usuario
- Modo edición con formulario completo
- Sube/elimina avatar con preview
- Muestra estadísticas de todos los módulos
- Calcula y muestra progreso de EXP hacia siguiente nivel
- Guarda cambios con validación

---

### `/settings`

**Archivo**: `app/pages/settings.vue`

Página de configuración.

**Características:**
- Habilitar/deshabilitar módulos
- Información de módulos
- Acciones rápidas
- Confirmación al deshabilitar

**Componentes utilizados:**
- `SettingsHeader`
- `ModuleList`
- `ModuleCard`
- `ConfirmDisableDialog`
- `InfoSection`
- `QuickActions`

**Funcionalidad:**
- Gestiona módulos habilitados
- Muestra información de cada módulo
- Confirma antes de deshabilitar módulos

---

## Rutas de Error

### `/404`

**Archivo**: `app/pages/404.vue`

Página de error 404 (No encontrado).

**Características:**
- Diseño consistente con la aplicación
- Mensaje de error amigable
- Botón para volver al inicio
- Iconos y animaciones

---

### `/500`

**Archivo**: `app/pages/500.vue`

Página de error 500 (Error del servidor).

**Características:**
- Diseño consistente
- Mensaje de error
- Opciones de recuperación

---

### Error Global

**Archivo**: `app/error.vue`

Página de error global de Nuxt.

**Características:**
- Captura errores no manejados
- Muestra información del error
- Opciones de navegación

---

## Middleware

### `auth.global.ts`

**Ubicación**: `app/middleware/auth.global.ts`

Middleware global que protege todas las rutas.

**Funcionalidad:**
- Verifica autenticación en cada navegación
- Redirige a `/login` si no está autenticado
- Redirige a `/onboarding` si no ha completado la configuración
- Sincroniza módulos desde la base de datos
- Gestiona sesiones de Supabase

**Rutas públicas:**
- `/login`
- `/register`

**Lógica:**
1. Si no hay sesión y no es ruta pública → redirige a `/login`
2. Si hay sesión y es ruta pública → redirige a `/`
3. Si está autenticado pero no tiene módulos → redirige a `/onboarding`
4. Sincroniza módulos si no están sincronizados

---

## Navegación

### Estructura de Navegación

La navegación se genera dinámicamente basándose en los módulos habilitados:

```typescript
// app/utils/nav-items.ts
export function getAllNavItems(modulesStore: ModulesStore): NavItem[]
```

**Módulos disponibles:**
- Inicio (siempre visible)
- Entrenamientos (si está habilitado)
- Manga (si está habilitado)
- Anime (si está habilitado)
- Quests (si está habilitado)
- Party (si está habilitado)
- Calendario (si está habilitado)
- Perfil (siempre visible)
- Configuración (siempre visible)

### Navegación Desktop

- Header con logo y navegación principal
- Navegación secundaria para módulos adicionales
- Perfil y configuración en el header

### Navegación Mobile

- Header compacto con logo
- Barra de navegación inferior
- Menú lateral deslizable

---

## 🎯 Rutas Dinámicas

Actualmente no hay rutas dinámicas, pero la estructura permite añadirlas fácilmente:

```vue
<!-- app/pages/anime/[id].vue -->
<script setup>
const route = useRoute()
const animeId = route.params.id
</script>
```

---

## 🔄 Redirecciones

### Después del Login

- Si no tiene módulos → `/onboarding`
- Si tiene módulos → `/`

### Después del Registro

- Siempre → `/onboarding`

### Después del Onboarding

- Siempre → `/`

### Usuario Autenticado en Rutas Públicas

- `/login` → `/`
- `/register` → `/`

---

## 📝 Notas

- Todas las rutas protegidas requieren autenticación
- El middleware gestiona automáticamente las redirecciones
- Los módulos se cargan dinámicamente según las preferencias del usuario
- Las rutas de error tienen diseño consistente con la aplicación

---

**Última actualización**: Enero 2025


