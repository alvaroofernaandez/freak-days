# Migración a Prisma - Guía de Implementación

## ✅ Cambios Realizados

### 1. Instalación y Configuración
- ✅ Añadido `@prisma/client` y `prisma` a `package.json`
- ✅ Creado `prisma/schema.prisma` con todos los modelos de la base de datos
- ✅ Creado composable `usePrisma()` para acceso al cliente de Prisma
- ✅ Actualizado `nuxt.config.ts` para incluir `DATABASE_URL`

### 2. Arquitectura de API Routes

Todas las operaciones de base de datos ahora se ejecutan en el servidor a través de API routes:

- **`server/api/anime/`**: Rutas para operaciones de anime
- **`server/api/manga/`**: Rutas para operaciones de manga
- **`server/api/quests/`**: Rutas para operaciones de quests
- **`server/api/profile/`**: Rutas para operaciones de perfil

### 3. Composables Migrados a API Routes

#### ✅ `useAnime.ts`
- Todas las operaciones CRUD ahora usan `$fetch` para llamar a API routes
- Type safety mejorado con tipos generados de Prisma
- Prisma nunca se expone al cliente

#### ✅ `useManga.ts`
- Migrado a API routes con soporte completo para Decimal (precios)
- Manejo mejorado de arrays (ownedVolumes)
- Operaciones ejecutadas exclusivamente en el servidor

#### ✅ `useQuests.ts`
- Migrado a API routes
- `completeQuest` usa transacciones de Prisma en el servidor
- Funciones RPC (`check_overdue_quests`, `check_quests_due_soon`) mantienen Supabase

#### ✅ `useProfile.ts`
- Operaciones CRUD migradas a API routes
- Funciones de upload (avatar/banner) mantienen Supabase Storage

### 3. Funcionalidades que Mantienen Supabase

Las siguientes funcionalidades siguen usando Supabase directamente:
- **Autenticación** (`useAuth.ts`): Supabase Auth
- **Storage** (`useProfile.ts`): Supabase Storage para avatares y banners
- **RPC Functions**: Funciones RPC específicas de Supabase
- **Realtime**: Si se usa en el futuro

## 📋 Próximos Pasos

### Comandos a Ejecutar

1. **Instalar dependencias:**
```bash
pnpm install
# o
npm install
```

2. **Configurar DATABASE_URL en `.env`:**
```env
DATABASE_URL=postgresql://user:password@host:port/database?schema=public&pgbouncer=true&connection_limit=1
```

Para obtener la URL:
- Ve a Supabase Dashboard → Settings → Database
- Copia "Connection string" (modo Transaction)
- Añade `&pgbouncer=true&connection_limit=1` al final

3. **Generar cliente de Prisma:**
```bash
pnpm prisma:generate
# o
npm run prisma:generate
```

4. **Sincronizar schema (opcional):**
```bash
pnpm prisma:push
# o
npm run prisma:push
```

### Comandos Disponibles

- `pnpm prisma:generate` - Generar cliente de Prisma
- `pnpm prisma:migrate` - Crear y aplicar migraciones
- `pnpm prisma:push` - Sincronizar schema sin migraciones
- `pnpm prisma:studio` - Abrir Prisma Studio (GUI)

## 🔄 Comandos de Migración

Si necesitas migrar datos o hacer cambios en el schema:

```bash
# Crear una nueva migración
pnpm prisma migrate dev --name nombre_migracion

# Aplicar migraciones pendientes
pnpm prisma migrate deploy

# Ver estado de migraciones
pnpm prisma migrate status
```

## 📝 Notas Importantes

1. **Connection Pooling**: Usa siempre el connection string con `pgbouncer=true` para mejor rendimiento
2. **Type Safety**: Prisma genera tipos TypeScript automáticamente
3. **Transacciones**: Prisma soporta transacciones nativas (usado en `completeQuest`)
4. **RLS**: Row Level Security de Supabase sigue activo, Prisma respeta las políticas
5. **Server-Side Only**: Prisma solo se ejecuta en el servidor, nunca en el cliente
6. **API Routes**: Todas las operaciones de BD pasan por API routes para mejor seguridad y bundle size
7. **Bundle Size**: Prisma no se incluye en el bundle del cliente, mejorando el rendimiento

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Verifica `DATABASE_URL` en `.env`
- Asegúrate de usar connection pooling
- Verifica whitelist de IPs en Supabase

### Error: "Schema validation failed"
- Ejecuta `pnpm prisma:generate`
- Verifica que el schema de Prisma coincida con la BD

### Error: "Connection limit exceeded"
- Usa `pgbouncer=true` en `DATABASE_URL`
- Verifica `connection_limit=1` en la URL

## 📚 Documentación

- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase + Prisma](https://supabase.com/docs/guides/integrations/prisma)
- Ver `docs/prisma-setup.md` para más detalles

