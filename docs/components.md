# Componentes - FreakDays

Documentación de los componentes Vue utilizados en FreakDays, organizados por categorías.

## 📚 Índice

- [Componentes UI](#componentes-ui)
- [Componentes de Layout](#componentes-de-layout)
- [Componentes de Módulos](#componentes-de-módulos)
- [Componentes de Error](#componentes-de-error)

---

## Componentes UI

Componentes reutilizables basados en shadcn-vue.

### Ubicación

`app/components/ui/`

### Componentes Disponibles

#### Button

Botón reutilizable con variantes.

```vue
<Button variant="default" size="md">Click me</Button>
```

**Props:**
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'

#### Card

Contenedor de tarjeta con header, content y footer.

```vue
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>Contenido</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### Input

Campo de entrada de texto.

```vue
<Input v-model="value" placeholder="Escribe aquí..." />
```

#### Progress

Barra de progreso.

```vue
<Progress :value="progress" />
```

#### Tooltip

Tooltip informativo.

```vue
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>Información adicional</TooltipContent>
</Tooltip>
```

#### Alert

Alerta informativa.

```vue
<Alert variant="default">
  <AlertTitle>Título</AlertTitle>
  <AlertDescription>Descripción</AlertDescription>
</Alert>
```

#### Empty

Estado vacío.

```vue
<Empty 
  title="No hay elementos"
  description="Añade tu primer elemento"
  :icon="Plus"
/>
```

#### DatePicker

Selector de fecha.

```vue
<DatePicker v-model="date" />
```

#### Calendar

Calendario para selección de fechas.

```vue
<Calendar v-model="date" />
```

#### Skeleton

Loader skeleton.

```vue
<Skeleton class="h-4 w-full" />
```

---

## Componentes de Layout

Componentes para la estructura general de la aplicación.

### AppHeader

Header principal para desktop.

**Ubicación**: `app/components/layout/AppHeader.vue`

**Props:**
- `profile`: `UserProfile | null`
- `expProgress`: `{ current: number, needed: number, progress: number }`
- `isActive`: `(to: string) => boolean`

**Slots:**
- `nav`: Navegación principal

### MobileHeader

Header para dispositivos móviles.

**Ubicación**: `app/components/layout/MobileHeader.vue`

**Props:**
- `profile`: `UserProfile | null`

### DesktopNav

Navegación principal para desktop.

**Ubicación**: `app/components/layout/DesktopNav.vue`

**Props:**
- `items`: `NavItem[]`
- `isActive`: `(to: string) => boolean`

### MobileNav

Navegación para móviles (barra inferior).

**Ubicación**: `app/components/layout/MobileNav.vue`

**Props:**
- `items`: `NavItem[]`
- `isActive`: `(to: string) => boolean`

### MobileMenu

Menú lateral para móviles.

**Ubicación**: `app/components/layout/MobileMenu.vue`

**Props:**
- `open`: `boolean`
- `items`: `NavItem[]`
- `isActive`: `(to: string) => boolean`

**Events:**
- `close`: Cierra el menú
- `logout`: Cierra sesión

---

## Componentes de Módulos

### Anime

#### AnimeCard

Tarjeta que muestra un anime individual.

**Ubicación**: `app/components/anime/AnimeCard.vue`

**Props:**
- `anime`: `AnimeEntry`

**Events:**
- `update-progress`: Actualiza el progreso
- `update-status`: Actualiza el estado
- `delete`: Elimina el anime

#### AnimeStats

Estadísticas del módulo de anime.

**Ubicación**: `app/components/anime/AnimeStats.vue`

**Props:**
- `animes`: `AnimeEntry[]`

#### AnimeMarketplace

Marketplace para buscar y añadir anime.

**Ubicación**: `app/components/anime/AnimeMarketplace.vue`

**Events:**
- `add-anime`: Añade un anime desde el marketplace

#### AnimeSearchBar

Barra de búsqueda de anime.

**Ubicación**: `app/components/anime/AnimeSearchBar.vue`

**Props:**
- `modelValue`: `string`

**Events:**
- `update:modelValue`: Actualiza el query

#### AnimeSearchCard

Tarjeta de resultado de búsqueda.

**Ubicación**: `app/components/anime/AnimeSearchCard.vue`

**Props:**
- `anime`: `AnimeSearchResult`

**Events:**
- `select`: Selecciona el anime

#### AnimeCardSkeleton

Skeleton loader para AnimeCard.

**Ubicación**: `app/components/anime/AnimeCardSkeleton.vue`

#### AnimeStatsSkeleton

Skeleton loader para AnimeStats.

**Ubicación**: `app/components/anime/AnimeStatsSkeleton.vue`

### Manga

#### MangaCard

Tarjeta que muestra un manga individual.

**Ubicación**: `app/components/manga/MangaCard.vue`

**Props:**
- `manga`: `MangaEntry`

**Events:**
- `add-volume`: Añade un volumen
- `remove-volume`: Elimina un volumen
- `update-price`: Actualiza el precio
- `update-status`: Actualiza el estado
- `delete`: Elimina el manga

#### MangaStats

Estadísticas del módulo de manga.

**Ubicación**: `app/components/manga/MangaStats.vue`

**Props:**
- `mangas`: `MangaEntry[]`

#### MangaList

Lista de mangas con filtros.

**Ubicación**: `app/components/manga/MangaList.vue`

**Props:**
- `mangas`: `MangaEntry[]`
- `filter`: `'all' | 'collecting' | 'completed' | 'wishlist'`

**Events:**
- `add-volume`
- `remove-volume`
- `update-price`
- `update-status`
- `delete`

#### AddMangaModal

Modal para añadir un nuevo manga.

**Ubicación**: `app/components/manga/AddMangaModal.vue`

**Props:**
- `open`: `boolean`

**Events:**
- `update:open`
- `add`: Añade el manga

#### MangaCardSkeleton

Skeleton loader para MangaCard.

**Ubicación**: `app/components/manga/MangaCardSkeleton.vue`

#### MangaStatsSkeleton

Skeleton loader para MangaStats.

**Ubicación**: `app/components/manga/MangaStatsSkeleton.vue`

### Quests

#### QuestCard

Tarjeta que muestra una quest individual.

**Ubicación**: `app/components/quests/QuestCard.vue`

**Props:**
- `quest`: `Quest`
- `isCompleted`: `boolean`

**Events:**
- `complete`: Completa la quest
- `delete`: Elimina la quest

#### QuestStats

Estadísticas del módulo de quests.

**Ubicación**: `app/components/quests/QuestStats.vue`

**Props:**
- `quests`: `Quest[]`
- `completedToday`: `number`

#### QuestList

Lista de quests.

**Ubicación**: `app/components/quests/QuestList.vue`

**Props:**
- `quests`: `Quest[]`
- `completedIds`: `string[]`

**Events:**
- `complete`
- `delete`

#### QuestFormModal

Modal para crear/editar quests.

**Ubicación**: `app/components/quests/QuestFormModal.vue`

**Props:**
- `open`: `boolean`
- `quest`: `Quest | null` (opcional, para edición)

**Events:**
- `update:open`
- `save`: Guarda la quest

#### NotificationPanel

Panel de notificaciones de quests.

**Ubicación**: `app/components/quests/NotificationPanel.vue`

**Props:**
- `overdueQuests`: `Quest[]`
- `dueSoonQuests`: `Quest[]`

#### OverdueBanner

Banner para quests vencidas.

**Ubicación**: `app/components/quests/OverdueBanner.vue`

**Props:**
- `count`: `number`

#### QuestCardSkeleton

Skeleton loader para QuestCard.

**Ubicación**: `app/components/quests/QuestCardSkeleton.vue`

#### QuestStatsSkeleton

Skeleton loader para QuestStats.

**Ubicación**: `app/components/quests/QuestStatsSkeleton.vue`

### Workouts

#### WorkoutCard

Tarjeta que muestra un entrenamiento.

**Ubicación**: `app/components/workouts/WorkoutCard.vue`

**Props:**
- `workout`: `Workout`

**Events:**
- `view`: Ver detalles
- `delete`: Eliminar

#### WorkoutStats

Estadísticas del módulo de workouts.

**Ubicación**: `app/components/workouts/WorkoutStats.vue`

**Props:**
- `workouts`: `Workout[]`

#### WorkoutList

Lista de entrenamientos.

**Ubicación**: `app/components/workouts/WorkoutList.vue`

**Props:**
- `workouts`: `Workout[]`

**Events:**
- `view`
- `delete`

#### StartWorkoutModal

Modal para iniciar un entrenamiento.

**Ubicación**: `app/components/workouts/StartWorkoutModal.vue`

**Props:**
- `open`: `boolean`

**Events:**
- `update:open`
- `start`: Inicia el entrenamiento

#### ActiveWorkoutModal

Modal para entrenamiento en curso.

**Ubicación**: `app/components/workouts/ActiveWorkoutModal.vue`

**Props:**
- `open`: `boolean`
- `workout`: `Workout`

**Events:**
- `update:open`
- `complete`: Completa el entrenamiento

#### WorkoutDetailModal

Modal con detalles del entrenamiento.

**Ubicación**: `app/components/workouts/WorkoutDetailModal.vue`

**Props:**
- `open`: `boolean`
- `workout`: `Workout`

**Events:**
- `update:open`

#### ExerciseCard

Tarjeta de ejercicio dentro de un entrenamiento.

**Ubicación**: `app/components/workouts/ExerciseCard.vue`

**Props:**
- `exercise`: `WorkoutExercise`

#### WorkoutDetailStats

Estadísticas detalladas de un entrenamiento.

**Ubicación**: `app/components/workouts/WorkoutDetailStats.vue`

**Props:**
- `workout`: `Workout`

#### WorkoutCardSkeleton

Skeleton loader para WorkoutCard.

**Ubicación**: `app/components/workouts/WorkoutCardSkeleton.vue`

#### WorkoutStatsSkeleton

Skeleton loader para WorkoutStats.

**Ubicación**: `app/components/workouts/WorkoutStatsSkeleton.vue`

### Party

#### PartyCard

Tarjeta que muestra un party individual.

**Ubicación**: `app/components/party/PartyCard.vue`

**Props:**
- `party`: `Party | ReadonlyParty`

**Events:**
- `view`: Ver detalles del party
- `delete`: Eliminar party
- `leave`: Abandonar party

#### PartyDetailsModal

Modal con detalles del party y gestión de miembros.

**Ubicación**: `app/components/party/PartyDetailsModal.vue`

**Props:**
- `open`: `boolean`
- `party`: `Party | ReadonlyParty`
- `getMemberRoleLabel`: `(role: PartyMember['role']) => string`

**Events:**
- `update:open`
- `regenerate-code`: Regenera código de invitación
- `remove-member`: Elimina un miembro
- `delete`: Elimina el party
- `leave`: Abandona el party

#### CreatePartyModal

Modal para crear un nuevo party.

**Ubicación**: `app/components/party/CreatePartyModal.vue`

**Props:**
- `open`: `boolean`

**Events:**
- `update:open`
- `create`: Crea el party

#### JoinPartyModal

Modal para unirse a un party mediante código de invitación.

**Ubicación**: `app/components/party/JoinPartyModal.vue`

**Props:**
- `open`: `boolean`

**Events:**
- `update:open`
- `join`: Se une al party

#### DeletePartyConfirmModal

Modal de confirmación para eliminar un party.

**Ubicación**: `app/components/party/DeletePartyConfirmModal.vue`

**Props:**
- `open`: `boolean`
- `party`: `Party | ReadonlyParty`

**Events:**
- `update:open`
- `confirm`: Confirma la eliminación

#### RemoveMemberConfirmModal

Modal de confirmación para eliminar un miembro del party.

**Ubicación**: `app/components/party/RemoveMemberConfirmModal.vue`

**Props:**
- `open`: `boolean`
- `party`: `Party | ReadonlyParty`
- `member`: `PartyMember | Readonly<PartyMember>`

**Events:**
- `update:open`
- `confirm`: Confirma la eliminación

#### PartyEmptyState

Estado vacío cuando el usuario no tiene parties.

**Ubicación**: `app/components/party/PartyEmptyState.vue`

**Events:**
- `create`: Abre modal de creación
- `join`: Abre modal de unión

### Calendar

#### CalendarGrid

Grid principal del calendario mensual con navegación.

**Ubicación**: `app/components/calendar/CalendarGrid.vue`

**Props:**
- `currentMonth`: `Date`
- `events`: `Release[]`
- `loading`: `boolean` (opcional)

**Events:**
- `update:currentMonth`: Cambia el mes
- `update:event`: Actualiza la fecha de un evento (drag and drop)
- `delete`: Elimina un evento
- `add`: Abre modal para añadir evento

#### CalendarDay

Tarjeta de un día individual en el calendario, actúa como drop zone.

**Ubicación**: `app/components/calendar/CalendarDay.vue`

**Props:**
- `date`: `Date`
- `events`: `Release[]`
- `isToday`: `boolean`
- `isCurrentMonth`: `boolean`
- `isDragging`: `boolean`
- `isHovered`: `boolean` (opcional)

**Events:**
- `drop`: Evento soltado en este día
- `delete`: Elimina un evento
- `dragstart`: Inicia el arrastre de un evento
- `dragend`: Termina el arrastre
- `hover`: Indica que el día está siendo hovered durante drag

#### CalendarEventCard

Mini card de evento arrastrable dentro de un día.

**Ubicación**: `app/components/calendar/CalendarEventCard.vue`

**Props:**
- `release`: `Release`
- `isDragging`: `boolean` (opcional)

**Events:**
- `delete`: Elimina el evento
- `dragstart`: Inicia el arrastre
- `dragend`: Termina el arrastre

#### CalendarEmptyState

Estado vacío cuando no hay eventos en el calendario.

**Ubicación**: `app/components/calendar/CalendarEmptyState.vue`

**Events:**
- `add`: Abre modal para añadir evento

### Profile

#### ProfileHeader

Header del perfil con avatar y controles de edición.

**Ubicación**: `app/components/profile/ProfileHeader.vue`

**Props:**
- `profile`: `UserProfile | null`
- `isEditing`: `boolean`

**Events:**
- `upload-avatar`: Sube un avatar
- `delete-avatar`: Elimina el avatar
- `edit`: Activa modo edición
- `cancel`: Cancela edición

#### ProfileEditForm

Formulario de edición del perfil.

**Ubicación**: `app/components/profile/ProfileEditForm.vue`

**Props:**
- `form`: `Partial<UserProfile>`

**Events:**
- `update:form`: Actualiza el formulario
- `save`: Guarda los cambios
- `cancel`: Cancela la edición

#### ProfileStats

Estadísticas del perfil del usuario.

**Ubicación**: `app/components/profile/ProfileStats.vue`

**Props:**
- `profile`: `UserProfile | null`
- `stats`: `{ quests: number; anime: number; workouts: number; manga: number }`

#### ProfileProgressCard

Tarjeta que muestra el progreso hacia el siguiente nivel.

**Ubicación**: `app/components/profile/ProfileProgressCard.vue`

**Props:**
- `currentExp`: `number`
- `neededExp`: `number`
- `progress`: `number`
- `level`: `number`

#### ProfileInfoCards

Tarjetas informativas del perfil (bio, ubicación, etc.).

**Ubicación**: `app/components/profile/ProfileInfoCards.vue`

**Props:**
- `profile`: `UserProfile | null`

### Auth

#### RegisterForm

Formulario de registro con validación de contraseña.

**Ubicación**: `app/components/auth/RegisterForm.vue`

**Props:**
- `loading`: `boolean`
- `error`: `string | null | undefined`

**Events:**
- `submit`: Envía el formulario de registro

#### RegisterHeader

Header de la página de registro.

**Ubicación**: `app/components/auth/RegisterHeader.vue`

#### RegisterSuccessMessage

Mensaje de éxito después del registro.

**Ubicación**: `app/components/auth/RegisterSuccessMessage.vue`

**Props:**
- `email`: `string`

#### PasswordStrengthIndicator

Indicador visual de la fortaleza de la contraseña.

**Ubicación**: `app/components/auth/PasswordStrengthIndicator.vue`

**Props:**
- `strength`: `number` (0-4)
- `label`: `string`
- `color`: `string`

#### GoogleSignInButton

Botón para iniciar sesión con Google.

**Ubicación**: `app/components/auth/GoogleSignInButton.vue`

**Props:**
- `loading`: `boolean`

**Events:**
- `click`: Inicia sesión con Google

---

## Componentes de Error

### ErrorBoundary

Captura errores en componentes hijos.

**Ubicación**: `app/components/error/ErrorBoundary.vue`

**Slots:**
- `default`: Contenido a proteger
- `fallback`: Contenido a mostrar en caso de error

### ErrorDisplay

Muestra un error de forma visual.

**Ubicación**: `app/components/error/ErrorDisplay.vue`

**Props:**
- `error`: `Error | string`
- `type`: `'error' | 'warning' | 'info'`

### ErrorState

Estado de error inline.

**Ubicación**: `app/components/error/ErrorState.vue`

**Props:**
- `error`: `Error | string`
- `compact`: `boolean` (opcional)

---

## Componentes del Dashboard

### ProfileCard

Tarjeta de perfil del usuario.

**Ubicación**: `app/components/index/ProfileCard.vue`

**Props:**
- `profile`: `UserProfile | null`
- `expProgress`: `{ current: number, needed: number, progress: number }`

### ModuleGrid

Grid de módulos disponibles.

**Ubicación**: `app/components/index/ModuleGrid.vue`

**Props:**
- `modules`: `AppModule[]`
- `isActive`: `(to: string) => boolean`

### WelcomeSection

Sección de bienvenida para usuarios no autenticados.

**Ubicación**: `app/components/index/WelcomeSection.vue`

### SettingsPrompt

Prompt para completar configuración.

**Ubicación**: `app/components/index/SettingsPrompt.vue`

**Props:**
- `show`: `boolean`

**Events:**
- `dismiss`: Cierra el prompt

### LoadingSpinner

Spinner de carga.

**Ubicación**: `app/components/index/LoadingSpinner.vue`

---

## Componentes de Configuración

### ModuleCard

Tarjeta de módulo en configuración.

**Ubicación**: `app/components/settings/ModuleCard.vue`

**Props:**
- `module`: `AppModule`
- `enabled`: `boolean`

**Events:**
- `toggle`: Cambia el estado del módulo

### ModuleList

Lista de módulos configurables.

**Ubicación**: `app/components/settings/ModuleList.vue`

**Props:**
- `modules`: `AppModule[]`

**Events:**
- `toggle`

### SettingsHeader

Header de la página de configuración.

**Ubicación**: `app/components/settings/SettingsHeader.vue`

### QuickActions

Acciones rápidas en configuración.

**Ubicación**: `app/components/settings/QuickActions.vue`

### InfoSection

Sección informativa.

**Ubicación**: `app/components/settings/InfoSection.vue`

**Props:**
- `title`: `string`
- `description`: `string`

### ConfirmDisableDialog

Diálogo de confirmación para deshabilitar módulos.

**Ubicación**: `app/components/settings/ConfirmDisableDialog.vue`

**Props:**
- `open`: `boolean`
- `moduleName`: `string`

**Events:**
- `update:open`
- `confirm`: Confirma la deshabilitación

---

## Componentes Globales

### ToastContainer

Contenedor de toasts globales.

**Ubicación**: `app/components/ToastContainer.vue`

Se renderiza automáticamente en `app.vue`.

---

## 🎨 Convenciones

### Props

- Props en kebab-case en templates
- Props en camelCase en TypeScript
- Props opcionales con `?`
- Props con valores por defecto usando `withDefaults()`

### Events

- Events en kebab-case: `update:open`, `add-anime`
- Emit con `defineEmits<{ event: [payload] }>()`

### Slots

- Slots con nombres descriptivos
- Slots con props cuando sea necesario

### Estilos

- Tailwind CSS para estilos
- Clases de shadcn-vue para componentes UI
- Variables CSS para temas

---

**Última actualización**: Enero 2025


