# AGENTS

## Objetivo del repo
Suite de apps internas con portal central: Inventario, CRM y Usuarios.

## Reglas para agentes
- No eliminar datos existentes sin pedir confirmacion.
- Mantener el flujo de auth propio (usuario/clave), sin Supabase Auth.
- Roles por app: admin/standard.
- El acceso a DB va por API routes con service role.
- Actualizar `docs/SUPABASE.md` si cambia el esquema.

## Como correr
- `npm install`
- `npm run dev`

## Configuracion
- `.env.local`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Ubicacion de la logica
- Auth: `src/context/AuthContext.tsx`, `src/lib/auth.ts`, `src/app/api/auth/*`
- Inventario: `src/context/InventoryContext.tsx`
- CRM: `src/app/crm/*`
- Usuarios: `src/app/users/*`
- Supabase server client: `src/lib/supabase/server.ts`

## Notas de seguridad
- Las cookies de sesion son httpOnly.
- No exponer service role key al cliente.
