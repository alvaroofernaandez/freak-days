# Guía de Desarrollo - FreakDays

Guía completa para desarrolladores que quieren contribuir o trabajar en FreakDays.

## 📚 Índice

- [Configuración del Entorno](#configuración-del-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Convenciones de Código](#convenciones-de-código)
- [Testing](#testing)
- [Debugging](#debugging)
- [Mejores Prácticas](#mejores-prácticas)

---

## Configuración del Entorno

### Prerrequisitos

- **Node.js**: 18 o superior
- **pnpm**: Recomendado (o npm/yarn/bun)
- **Cuenta de Supabase**: Para backend
- **Git**: Para control de versiones

### Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/alvaroofernaandez/freak-days.git
cd freak-days
```

2. **Instalar dependencias**

```bash
pnpm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz:

```env
SUPABASE_URL=tu_proyecto_url
SUPABASE_ANON_KEY=tu_anon_key
DATABASE_URL=postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

Para obtener `DATABASE_URL`:
- Ve a Supabase Dashboard → Settings → Database
- Copia la "Connection string" bajo "Connection pooling" (modo Transaction)
- Añade `&pgbouncer=true&connection_limit=1` al final

4. **Generar cliente de Prisma**

```bash
pnpm prisma:generate
```

5. **Configurar Supabase**

- Crea un proyecto en [Supabase](https://supabase.com)
- Ejecuta las migraciones desde `database/migrations/`
- Configura las políticas RLS según `database/schema.sql`

5. **Iniciar servidor de desarrollo**

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## Estructura del Proyecto

Ver [Arquitectura](./architecture.md) para detalles completos.

### Directorios Principales

```
freak-days/
├── app/                    # Código de la aplicación Nuxt
│   ├── components/         # Componentes Vue
│   ├── pages/              # Páginas/rutas
│   ├── composables/        # Lógica reutilizable
│   ├── layouts/            # Layouts de página
│   ├── middleware/         # Middleware de rutas
│   └── utils/              # Utilidades
├── server/                 # Código del servidor (Nuxt)
│   ├── api/                # API Routes
│   └── utils/              # Utilidades del servidor
├── prisma/                 # Prisma ORM
│   └── schema.prisma      # Schema de Prisma
├── domain/                 # Lógica de negocio
│   ├── types/              # Tipos TypeScript
│   └── constants/          # Constantes
├── stores/                 # Stores de Pinia
├── database/               # Migraciones SQL
└── tests/                  # Tests
```

---

## Convenciones de Código

### Naming

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos | kebab-case | `anime-card.vue` |
| Componentes | PascalCase | `AnimeCard` |
| Composables | camelCase + `use` | `useAnime()` |
| Stores | camelCase + `Store` | `useModulesStore()` |
| Tipos | PascalCase | `AnimeEntry` |
| Constantes | SCREAMING_SNAKE_CASE | `DIFFICULTY_EXP` |

### Estructura de Componentes

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'
import type { AnimeEntry } from '@/composables/useAnime'

// 2. Props y Emits
interface Props {
  anime: AnimeEntry
}

defineProps<Props>()

const emit = defineEmits<{
  update: [value: string]
  delete: []
}>()

// 3. Composables y Stores
const animeApi = useAnime()
const toast = useToast()

// 4. Refs y Reactive
const isLoading = ref(false)

// 5. Computed
const progress = computed(() => {
  // lógica
})

// 6. Funciones
async function handleUpdate() {
  // lógica
}

// 7. Lifecycle Hooks
onMounted(() => {
  // lógica
})
</script>

<template>
  <!-- Template -->
</template>
```

### TypeScript

- **Strict mode**: Siempre activado
- **Sin `any`**: Usar tipos específicos o `unknown`
- **Interfaces**: Para objetos y estructuras de datos
- **Types**: Para uniones y tipos más complejos

```typescript
// ✅ Bueno
interface User {
  id: string
  name: string
}

type Status = 'active' | 'inactive'

// ❌ Malo
const user: any = {}
```

### Vue Composition API

- Siempre usar `<script setup>`
- Preferir `ref` sobre `reactive` para primitivos
- Usar `computed` para valores derivados
- Usar `watch` para efectos secundarios

```typescript
// ✅ Bueno
const count = ref(0)
const doubled = computed(() => count.value * 2)

// ❌ Malo
const state = reactive({ count: 0 })
```

---

## Testing

### Configuración

FreakDays utiliza **Vitest** para testing.

**Archivo de configuración**: `vitest.config.ts`

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Modo watch
pnpm test:watch

# Con cobertura
pnpm test:coverage
```

### Estructura de Tests

```
tests/
├── unit/
│   ├── domain/
│   │   └── quests.test.ts
│   └── stores/
│       └── modules.test.ts
└── setup.ts
```

### Ejemplo de Test

```typescript
import { describe, it, expect } from 'vitest'
import { calculateTotalExp } from '~~/domain/types/quests'

describe('calculateTotalExp', () => {
  it('should calculate base exp for easy quest', () => {
    const exp = calculateTotalExp('easy', 0)
    expect(exp).toBe(10)
  })
  
  it('should add streak bonus', () => {
    const exp = calculateTotalExp('medium', 7)
    expect(exp).toBe(30) // 25 base + 5 bonus
  })
})
```

### Cobertura Objetivo

- `domain/`: 90%+
- `composables/`: 80%+
- `stores/`: 80%+
- `components/`: Críticos solamente

---

## Debugging

### DevTools

Nuxt DevTools está habilitado en desarrollo:

```typescript
// nuxt.config.ts
devtools: { enabled: true }
```

Accede en: `http://localhost:3000/_nuxt/dev`

### Vue DevTools

Instala la extensión del navegador:

- [Chrome](https://chrome.google.com/webstore/detail/vuejs-devtools)
- [Firefox](https://addons.mozilla.org/firefox/addon/vue-js-devtools)

### Console Logging

```typescript
// Desarrollo
if (import.meta.dev) {
  console.log('Debug info:', data)
}

// Producción (evitar)
console.error('Error:', error) // Solo errores críticos
```

### Supabase Debugging

Usa el dashboard de Supabase para:

- Ver queries en tiempo real
- Inspeccionar datos
- Ver logs de autenticación
- Revisar políticas RLS

---

## Mejores Prácticas

### Performance

1. **Lazy Loading**

```typescript
const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)
```

2. **Computed vs Methods**

```typescript
// ✅ Usar computed para valores derivados
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// ✅ Usar methods para acciones
function handleClick() {
  // acción
}
```

3. **v-show vs v-if**

```typescript
// ✅ v-show para elementos que se muestran/ocultan frecuentemente
<div v-show="isVisible">Contenido</div>

// ✅ v-if para elementos que raramente se renderizan
<Modal v-if="showModal" />
```

### Accesibilidad

1. **Semantic HTML**

```vue
<!-- ✅ Bueno -->
<button @click="handleClick">Aceptar</button>
<nav aria-label="Navegación principal">
  <ul>
    <li><a href="/">Inicio</a></li>
  </ul>
</nav>

<!-- ❌ Malo -->
<div @click="handleClick">Aceptar</div>
```

2. **ARIA Labels**

```vue
<button aria-label="Cerrar modal">
  <X class="h-4 w-4" />
</button>
```

3. **Contraste**

- Mínimo 4.5:1 para texto normal
- Mínimo 3:1 para texto grande

### Seguridad

1. **Validación de Inputs**

```typescript
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

2. **Sanitización**

Supabase maneja la sanitización automáticamente, pero siempre validar en el cliente.

3. **RLS**

Nunca confiar solo en validación del cliente. Las políticas RLS en Supabase son la última línea de defensa.

### Código Limpio

1. **Sin Comentarios**

El código debe ser auto-documentado:

```typescript
// ❌ Malo
// Calcula el total de EXP
const total = baseExp + bonus

// ✅ Bueno
const totalExp = calculateTotalExp(baseExp, streakBonus)
```

2. **Funciones Pequeñas**

```typescript
// ❌ Malo
function processData(data) {
  // 100 líneas de código
}

// ✅ Bueno
function processData(data) {
  const validated = validateData(data)
  const transformed = transformData(validated)
  return saveData(transformed)
}
```

3. **Nombres Descriptivos**

```typescript
// ❌ Malo
const d = new Date()
const x = calculate()

// ✅ Bueno
const currentDate = new Date()
const totalExp = calculateTotalExp()
```

---

## Workflow de Desarrollo

### 1. Crear una Rama

```bash
git checkout -b feature/nueva-funcionalidad
```

### 2. Desarrollar

- Escribir tests primero (TDD)
- Implementar funcionalidad
- Asegurar que los tests pasen

### 3. Commit

```bash
git add .
git commit -m "feat: añade nueva funcionalidad"
```

**Convenciones de commits:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Tareas de mantenimiento

### 4. Push y PR

```bash
git push origin feature/nueva-funcionalidad
```

Crear Pull Request en GitHub.

---

## Troubleshooting

### Error: "Cannot find module"

```bash
# Limpiar y reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: "Supabase connection failed"

- Verificar variables de entorno
- Verificar que Supabase esté activo
- Revisar políticas RLS

### Error: "Type error"

- Verificar que TypeScript esté en strict mode
- Revisar tipos en `domain/types/`
- Asegurar que todos los tipos estén importados

---

## Recursos

- [Nuxt Documentation](https://nuxt.com/)
- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vitest Documentation](https://vitest.dev/)

---

**Última actualización**: Enero 2025


