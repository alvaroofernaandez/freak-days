# Quest Notifications Edge Function

Esta función Edge de Supabase envía notificaciones push cuando se crean nuevas notificaciones de misiones.

## Configuración

### 1. Desplegar la función

```bash
supabase functions deploy quest-notifications
```

### 2. Configurar variables de entorno

Necesitas configurar al menos uno de los siguientes servicios de push notifications:

#### Para Expo (Recomendado para React Native)

1. Obtén tu token de acceso de Expo desde [Expo Access Token Settings](https://expo.dev/accounts/_/settings/access-tokens)
2. Configura el secreto:

```bash
supabase secrets set EXPO_ACCESS_TOKEN=your_expo_access_token
```

#### Para Firebase Cloud Messaging (FCM)

1. Obtén tu Server Key desde Firebase Console > Project Settings > Cloud Messaging
2. Configura el secreto:

```bash
supabase secrets set FCM_SERVER_KEY=your_fcm_server_key
```

### 3. Configurar Webhook en Supabase Dashboard

1. Ve a **Database** > **Webhooks** en tu dashboard de Supabase
2. Crea un nuevo webhook:
   - **Table**: `quest_notifications`
   - **Events**: `Insert`
   - **Type**: Supabase Edge Function
   - **Function**: `quest-notifications`
   - **Method**: `POST`
   - **Timeout**: `1000`
3. Añade el header de autenticación con la service role key

### 4. Configurar Cron Job (Opcional)

Para ejecutar las verificaciones automáticamente cada 5 minutos:

1. Habilita la extensión `pg_cron` en Supabase Dashboard > Database > Extensions
2. Ejecuta en SQL Editor:

```sql
SELECT cron.schedule(
  'check-quest-notifications',
  '*/5 * * * *',
  'SELECT trigger_quest_notifications_check()'
);
```

## Uso

Las notificaciones se generan automáticamente cuando:
- Una misión está atrasada (pasó la fecha/hora límite)
- Una misión está próxima a vencer (dentro del tiempo de recordatorio configurado)

Las notificaciones se envían como push notifications a los dispositivos del usuario si tienen configurado un token de push.

## Estructura de Notificaciones

Las notificaciones se almacenan en la tabla `quest_notifications` con los siguientes tipos:
- `overdue`: Misión atrasada
- `due_soon`: Misión próxima a vencer
- `reminder`: Recordatorio personalizado

