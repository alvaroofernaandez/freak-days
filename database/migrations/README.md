# Migraciones de Base de Datos

Este directorio contiene los scripts de migración para actualizar el schema de Supabase.

## Migración: Workouts con Series (001)

Esta migración agrega soporte para:
- Entrenamientos en curso (`status: 'in_progress'`)
- Series individuales con peso y repeticiones
- Tracking temporal de entrenamientos

### Opción 1: Ejecutar manualmente en Supabase Dashboard

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Abre el archivo `001_workouts_sets_migration.sql`
4. Copia y pega todo el contenido
5. Haz clic en **Run** para ejecutar

### Opción 2: Usar el script Node.js (requiere configuración)

```bash
# Configurar variables de entorno
export SUPABASE_URL="tu-url-de-supabase"
export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

# Ejecutar migración
node database/migrations/run-migration.js
```

**Nota:** El script requiere una función RPC en Supabase. Si no la tienes, usa la Opción 1.

### Opción 3: Usar Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db push
```

## Cambios incluidos en esta migración

1. **Tabla `workouts`:**
   - Agregado campo `status` ('in_progress' | 'completed')
   - Agregados campos `started_at` y `completed_at`
   - Creado índice para entrenamientos en curso

2. **Tabla `workout_exercises`:**
   - Eliminados campos `sets`, `reps`, `weight_kg` (movidos a `workout_sets`)
   - Agregado campo `created_at`

3. **Nueva tabla `workout_sets`:**
   - `set_number`: Número de serie
   - `reps`: Repeticiones
   - `weight_kg`: Peso en kilogramos
   - `rest_seconds`: Tiempo de descanso (opcional)
   - `notes`: Notas adicionales

4. **Políticas RLS:**
   - Agregada política para `workout_sets`

5. **Migración de datos:**
   - Los datos existentes en el formato antiguo se migran automáticamente a `workout_sets`

## Verificación post-migración

Después de ejecutar la migración, verifica que todo funcionó correctamente:

```sql
-- Verificar que la tabla workout_sets existe
SELECT COUNT(*) FROM public.workout_sets;

-- Verificar entrenamientos en curso
SELECT COUNT(*) FROM public.workouts WHERE status = 'in_progress';

-- Verificar estructura de workouts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workouts' 
AND column_name IN ('status', 'started_at', 'completed_at');
```

## Rollback (si es necesario)

Si necesitas revertir la migración:

```sql
-- Eliminar tabla workout_sets
DROP TABLE IF EXISTS public.workout_sets CASCADE;

-- Eliminar columnas de workouts
ALTER TABLE public.workouts 
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS started_at,
DROP COLUMN IF EXISTS completed_at;

-- Restaurar columnas en workout_exercises (si las necesitas)
ALTER TABLE public.workout_exercises 
ADD COLUMN IF NOT EXISTS sets INTEGER,
ADD COLUMN IF NOT EXISTS reps INTEGER,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(6,2);
```

