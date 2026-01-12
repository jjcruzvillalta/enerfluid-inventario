# Arquitectura

## Stack
- Next.js (app router)
- React 18
- Tailwind CSS
- Chart.js
- Supabase (solo DB)

## Estructura
- `src/app/`: rutas y layouts (portal, inventory, crm, users)
- `src/components/`: UI y modulos reutilizables
- `src/context/AuthContext.tsx`: sesion y roles
- `src/context/InventoryContext.tsx`: carga de datos de inventario
- `src/lib/`: parsing, calculos, auth y clientes Supabase
- `public/`: assets

## Flujo de auth
1. Login via `/api/auth/login` (usuario/clave).
2. Se crea sesion con cookie httpOnly.
3. `/api/auth/me` expone usuario + roles.
4. Layouts bloquean acceso segun rol.

## Flujo de datos de inventario
1. `InventoryContext` llama `/api/inventory/data`.
2. API usa service role para leer tablas.
3. Uploads llaman `/api/inventory/upload` con lotes.

## Puntos clave
- El front no usa Supabase Auth.
- El acceso a DB va por API routes.
- Los roles estan en `user_roles`.
