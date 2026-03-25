# Supabase (producción) — SMS con Twilio

## 1. SQL

En **Supabase Dashboard → SQL → New query**, pega y ejecuta el contenido de:

`migrations/20250322120000_phone_verifications.sql`

Luego ejecuta también (perfiles, pedidos y políticas del panel admin):

`migrations/20250324120000_profiles_orders_admin.sql`

Catálogo (categorías, subcategorías, productos e imágenes en Storage):

`migrations/20250324160000_shop_catalog.sql`

Productos opcionales sin subcategoría (`category_id` obligatorio):

`migrations/20250324170000_shop_products_category_optional.sql`

El correo en la función SQL `is_admin()` debe coincidir con el allowlist en `beshop/src/utils/adminAccess.ts` (si cambias el admin, actualiza ambos sitios).

## 2. Secrets (Project Settings → Edge Functions → Secrets)

| Nombre | Descripción |
|--------|-------------|
| `TWILIO_ACCOUNT_SID` | Consola Twilio |
| `TWILIO_AUTH_TOKEN` | Consola Twilio |
| `TWILIO_PHONE_NUMBER` | Número SMS en E.164 (ej. `+15551234567`) |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya las inyecta Supabase en las funciones; no hace falta duplicarlas salvo que tu CLI lo requiera.

## Despliegue desde el dashboard (Editor)

Cada función debe ser **autocontenida**: solo se sube la carpeta de esa función, así que **no uses** imports a archivos fuera de esa carpeta (por ejemplo `../_shared/...`). El código CORS va duplicado en cada `index.ts` a propósito.

## 3. Desplegar funciones (CLI)

```bash
cd supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy send-phone-verification
supabase functions deploy verify-phone-code
```

## 4. Frontend

En `beshop/.env.production` (o variables del hosting) define `REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_ANON_KEY` del mismo proyecto.

No uses servidor Node local: las pantallas llaman a `supabase.functions.invoke(...)`.
