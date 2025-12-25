# Guía de Despliegue - FreakDays

Guía completa para desplegar FreakDays en producción.

## 📚 Índice

- [Preparación](#preparación)
- [Variables de Entorno](#variables-de-entorno)
- [Build](#build)
- [Despliegue](#despliegue)
- [Post-Despliegue](#post-despliegue)

---

## Preparación

### Checklist Pre-Despliegue

- [ ] Todas las migraciones de base de datos aplicadas
- [ ] Variables de entorno configuradas
- [ ] Políticas RLS configuradas correctamente
- [ ] Storage buckets configurados
- [ ] Tests pasando
- [ ] Build sin errores
- [ ] SEO configurado
- [ ] Favicon y manifest configurados

---

## Variables de Entorno

### Producción

Crea un archivo `.env.production` o configura en tu plataforma de despliegue:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_produccion
```

### Verificación

Asegúrate de que:

1. **Supabase URL** apunta al proyecto correcto
2. **Anon Key** es la clave pública (no la service role key)
3. Las variables están disponibles en el entorno de producción

---

## Build

### Build Local

```bash
# Build para producción
pnpm build

# Preview del build
pnpm preview
```

### Optimizaciones Automáticas

Nuxt optimiza automáticamente:

- **Code Splitting**: Divide el código en chunks
- **Tree Shaking**: Elimina código no usado
- **Minificación**: Minifica JS y CSS
- **Compresión**: Gzip/Brotli

### Verificar Bundle Size

```bash
pnpm build --analyze
```

Esto genera un reporte del tamaño del bundle.

---

## Despliegue

### Vercel (Recomendado)

1. **Conectar repositorio**

- Ve a [Vercel](https://vercel.com)
- Importa tu repositorio de GitHub

2. **Configurar proyecto**

- **Framework Preset**: Nuxt.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.output`
- **Install Command**: `pnpm install`

3. **Variables de entorno**

Añade en la configuración del proyecto:

```
SUPABASE_URL=tu_url
SUPABASE_ANON_KEY=tu_key
```

4. **Desplegar**

Vercel despliega automáticamente en cada push a `main`.

### Netlify

1. **Configurar `netlify.toml`**

```toml
[build]
  command = "pnpm build"
  publish = ".output/public"

[[plugins]]
  package = "@netlify/plugin-nuxt"

[build.environment]
  NODE_VERSION = "18"
```

2. **Variables de entorno**

Configura en Netlify Dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

3. **Desplegar**

Netlify despliega automáticamente desde Git.

### Docker

1. **Crear `Dockerfile`**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

2. **Build y Run**

```bash
docker build -t freak-days .
docker run -p 3000:3000 \
  -e SUPABASE_URL=tu_url \
  -e SUPABASE_ANON_KEY=tu_key \
  freak-days
```

### Servidor Propio

1. **Build**

```bash
pnpm build
```

2. **Copiar archivos**

```bash
# Copiar .output a servidor
scp -r .output user@server:/path/to/app
```

3. **Ejecutar**

```bash
# En el servidor
cd /path/to/app
node .output/server/index.mjs
```

4. **PM2 (Recomendado)**

```bash
pm2 start .output/server/index.mjs --name freak-days
pm2 save
pm2 startup
```

---

## Post-Despliegue

### Verificaciones

1. **Health Check**

```bash
curl https://tu-dominio.com/api/health
```

2. **Verificar Autenticación**

- Probar login
- Probar registro
- Verificar redirecciones

3. **Verificar Módulos**

- Probar cada módulo
- Verificar que los datos se carguen
- Probar operaciones CRUD

### Monitoreo

#### Errores

Configura un servicio de monitoreo de errores:

- [Sentry](https://sentry.io)
- [LogRocket](https://logrocket.com)
- [Rollbar](https://rollbar.com)

#### Performance

- [Vercel Analytics](https://vercel.com/analytics)
- [Google Analytics](https://analytics.google.com)
- [Web Vitals](https://web.dev/vitals/)

### Supabase

#### Verificar RLS

Asegúrate de que todas las políticas RLS estén activas:

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

#### Storage

Verifica que los buckets estén configurados:

- `avatars`: Público con políticas RLS

#### Edge Functions

Si usas Edge Functions, despliégalas:

```bash
supabase functions deploy quest-notifications
```

---

## Optimizaciones de Producción

### CDN

Configura un CDN para assets estáticos:

- Cloudflare
- AWS CloudFront
- Vercel Edge Network (automático)

### Caching

Nuxt configura automáticamente:

- **Static Assets**: Cache largo
- **HTML**: Cache corto
- **API Routes**: Sin cache

### Imágenes

Optimiza imágenes:

- Usa formatos modernos (WebP, AVIF)
- Lazy loading automático
- Responsive images

---

## Seguridad

### Headers de Seguridad

Nuxt configura automáticamente headers de seguridad.

### Variables de Entorno

- **Nunca** commitear `.env` files
- Usar variables de entorno del proveedor
- Rotar keys periódicamente

### Supabase

- Usar **Anon Key** en el cliente (no Service Role Key)
- Configurar políticas RLS correctamente
- Limitar acceso a Storage buckets

---

## Rollback

### Vercel

```bash
# Ver deployments
vercel ls

# Rollback a deployment anterior
vercel rollback [deployment-url]
```

### Netlify

En Netlify Dashboard:
- Ve a Deploys
- Selecciona deployment anterior
- Click en "Publish deploy"

### Docker

```bash
# Tag version anterior
docker tag freak-days:previous freak-days:latest
docker-compose up -d
```

---

## Troubleshooting

### Error: "Cannot connect to Supabase"

- Verificar variables de entorno
- Verificar que Supabase esté activo
- Revisar CORS settings en Supabase

### Error: "Build failed"

- Verificar Node.js version (18+)
- Limpiar cache: `rm -rf .nuxt node_modules`
- Reinstalar: `pnpm install`

### Error: "RLS policy violation"

- Verificar políticas en Supabase
- Revisar que el usuario esté autenticado
- Verificar que `auth.uid()` coincida con `user_id`

---

## Recursos

- [Nuxt Deployment](https://nuxt.com/docs/getting-started/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

**Última actualización**: Enero 2025


