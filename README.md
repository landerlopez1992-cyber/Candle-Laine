# Candle Laine

Tienda en React (plantilla **BeShop**): código en `beshop/`. Documentación HTML en `documentaion/`.

## Desarrollo

```bash
cd beshop
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000).

## Producción (SMS / Twilio vía Supabase)

El envío y la verificación de códigos por SMS **no usan ningún servidor local**: la app llama a **Supabase Edge Functions** (`send-phone-verification`, `verify-phone-code`) con Twilio en los secrets del proyecto.

1. Ejecuta el SQL en `supabase/migrations/`.
2. Configura secrets de Twilio y despliega las funciones (ver `supabase/DEPLOY.md`).
3. En el hosting (Vercel, Netlify, etc.) define `REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_ANON_KEY` del mismo proyecto Supabase.
