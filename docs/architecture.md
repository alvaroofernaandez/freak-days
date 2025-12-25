# Arquitectura de FreakDays

Este documento describe la arquitectura general del proyecto FreakDays, sus principios de diseño y la organización del código.

## 🏗️ Principios Arquitectónicos

### 1. Domain-Driven Design (DDD)

La lógica de negocio está separada de la capa de presentación y es independiente del framework:

- **`domain/`**: Contiene tipos, constantes y lógica de negocio pura
- **`app/`**: Contiene la implementación específica de Nuxt/Vue
- **`stores/`**: Gestiona el estado de la aplicación con Pinia

### 2. Separación de Responsabilidades

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (app/components, app/pages)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Application Layer               │
│  (app/composables, stores/)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Domain Layer                    │
│  (domain/types, domain/constants)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Layer                      │
│  (Supabase, composables de datos)       │
└─────────────────────────────────────────┘
```

### 3. Composition API

Todo el código Vue utiliza Composition API con `<script setup>`:

- Mejor organización del código
- Mejor inferencia de tipos
- Reutilización de lógica mediante composables
- Performance optimizada

### 4. Type Safety

TypeScript strict mode en todo el proyecto:

- Sin tipos `any`
- Interfaces bien definidas
- Tipos compartidos en `domain/types/`

## 📁 Estructura del Proyecto

```
freak-days/
├── app/                          # Capa de aplicación Nuxt
│   ├── components/               # Componentes Vue (UI)
│   │   ├── anime/                # Componentes del módulo anime
│   │   ├── manga/                # Componentes del módulo manga
│   │   ├── quests/               # Componentes del módulo quests
│   │   ├── workouts/             # Componentes del módulo workouts
│   │   ├── layout/               # Componentes de layout
│   │   ├── index/                 # Componentes del dashboard
│   │   ├── settings/              # Componentes de configuración
│   │   ├── error/                 # Componentes de manejo de errores
│   │   └── ui/                    # Componentes UI reutilizables (shadcn-vue)
│   ├── pages/                     # Páginas/rutas de Nuxt
│   ├── layouts/                    # Layouts de página
│   ├── composables/               # Composables Vue (lógica reutilizable)
│   ├── middleware/                # Middleware de rutas
│   ├── utils/                     # Utilidades y helpers
│   ├── lib/                        # Librerías y configuraciones
│   └── assets/                     # Assets estáticos (CSS, imágenes)
│
├── domain/                         # Capa de dominio (framework-agnostic)
│   ├── types/                      # Tipos TypeScript compartidos
│   │   ├── anime.ts               # Tipos del módulo anime
│   │   ├── quests.ts              # Tipos del módulo quests
│   │   ├── modules.ts             # Tipos de módulos
│   │   └── index.ts               # Exportaciones centralizadas
│   └── constants/                 # Constantes del dominio
│       └── module-icons.ts        # Iconos de módulos
│
├── stores/                         # Stores de Pinia (gestión de estado)
│   ├── auth.ts                    # Store de autenticación
│   └── modules.ts                 # Store de módulos
│
├── database/                       # Base de datos
│   ├── schema.sql                 # Esquema completo
│   └── migrations/                # Migraciones SQL
│       ├── 001_workouts_sets_migration.sql
│       ├── 002_manga_pricing_migration.sql
│       └── 003_profile_enhancement.sql
│
├── supabase/                       # Configuración de Supabase
│   └── functions/                 # Edge Functions
│       └── quest-notifications/   # Función de notificaciones
│
├── tests/                          # Tests
│   ├── unit/                      # Tests unitarios
│   └── setup.ts                   # Configuración de tests
│
├── public/                         # Archivos públicos estáticos
│   ├── logo.png                   # Logo de la aplicación
│   ├── robots.txt                 # Configuración SEO
│   └── site.webmanifest          # PWA manifest
│
├── nuxt.config.ts                 # Configuración de Nuxt
├── package.json                   # Dependencias del proyecto
├── tsconfig.json                  # Configuración de TypeScript
├── vitest.config.ts              # Configuración de tests
└── components.json               # Configuración de shadcn-vue
```

## 🔄 Flujo de Datos

### 1. Lectura de Datos

```
Componente Vue
    ↓
Composable (useAnime, useQuests, etc.)
    ↓
Supabase Client (useSupabase)
    ↓
PostgreSQL Database
```

### 2. Escritura de Datos

```
Usuario interactúa con Componente
    ↓
Componente llama a Composable
    ↓
Composable valida y transforma datos
    ↓
Composable llama a Supabase
    ↓
Supabase ejecuta operación
    ↓
Composable actualiza estado local
    ↓
Componente se actualiza reactivamente
```

### 3. Gestión de Estado

```
Pinia Stores (auth, modules)
    ↓
Composables (usan stores)
    ↓
Componentes Vue (usan composables)
```

## 🎨 Patrones de Diseño Utilizados

### 1. Repository Pattern

Los composables actúan como repositorios, abstraen el acceso a datos:

```typescript
// app/composables/useAnime.ts
export function useAnime() {
  async function fetchAnimeList(): Promise<AnimeEntry[]> {
    // Abstrae el acceso a Supabase
  }
}
```

### 2. Composable Pattern

Lógica reutilizable encapsulada en composables:

```typescript
// app/composables/useQuests.ts
export function useQuests() {
  // Lógica de quests reutilizable
}
```

### 3. Factory Pattern

Utilidades para crear objetos complejos:

```typescript
// app/utils/anime-parser.ts
export function parseJikanAnime(data: AnimeSearchResult): CreateAnimeDTO {
  // Crea DTOs desde datos externos
}
```

### 4. Observer Pattern

Vue Reactivity System:

```typescript
const count = ref(0)
watch(count, (newVal) => {
  // Reacciona a cambios
})
```

## 🔐 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado en Supabase:

- Los usuarios solo pueden acceder a sus propios datos
- Las políticas están definidas en `database/schema.sql`
- Validación adicional en los composables

### Autenticación

- Supabase Auth para autenticación
- JWT tokens gestionados automáticamente
- Middleware global para proteger rutas

## 📦 Módulos de la Aplicación

Cada módulo sigue la misma estructura:

```
Módulo (ej: anime)
├── domain/types/anime.ts          # Tipos TypeScript
├── app/composables/useAnime.ts    # Lógica de negocio
├── app/components/anime/           # Componentes UI
├── app/pages/anime.vue            # Página principal
└── database/schema.sql             # Tablas relacionadas
```

## 🚀 Performance

### Optimizaciones Implementadas

1. **Lazy Loading**: Componentes pesados cargados bajo demanda
2. **Code Splitting**: Nuxt divide automáticamente el código
3. **Image Optimization**: Uso de imágenes optimizadas
4. **Caching**: Supabase cachea queries frecuentes
5. **Debouncing**: Búsquedas con debounce para reducir requests

### Bundle Size

- Componentes UI importados bajo demanda
- Tree-shaking automático con Vite
- Análisis de bundle: `pnpm build --analyze`

## 🧪 Testing

### Estrategia de Testing

- **Unit Tests**: Lógica de negocio en `domain/` y `composables/`
- **Integration Tests**: Componentes y páginas
- **E2E Tests**: Flujos completos de usuario (futuro)

### Cobertura Objetivo

- `domain/`: 90%+
- `composables/`: 80%+
- `stores/`: 80%+
- `components/`: Críticos solamente

## 📝 Convenciones de Código

Ver [AGENTS.md](../AGENTS.md) para convenciones detalladas.

### Resumen

- **Archivos**: kebab-case
- **Componentes**: PascalCase
- **Composables**: camelCase con prefijo `use`
- **Stores**: camelCase con sufijo `Store`
- **Tipos**: PascalCase
- **Constantes**: SCREAMING_SNAKE_CASE

## 🔄 Migraciones y Evolución

### Versionado de Base de Datos

Las migraciones están numeradas secuencialmente:

- `001_workouts_sets_migration.sql`
- `002_manga_pricing_migration.sql`
- `003_profile_enhancement.sql`

### Backward Compatibility

- Las migraciones son idempotentes (usando `IF NOT EXISTS`)
- Los cambios de esquema no rompen código existente
- Versionado semántico para releases

## 📚 Referencias

- [Nuxt.js Documentation](https://nuxt.com/)
- [Vue.js Documentation](https://vuejs.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Pinia Documentation](https://pinia.vuejs.org/)

---

**Última actualización**: Enero 2025


