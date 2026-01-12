# Enerfluid Apps

Suite de aplicaciones internas con un portal central: Inventario, CRM y Usuarios.

## Que hace
- Portal central para acceder a todas las apps.
- Autenticacion propia (usuario/clave) y roles por app.
- Inventario: carga Excel, analisis, detalle por item, reposicion.
- CRM: dashboard, clientes, contactos, oportunidades, actividades y configuracion.
- Usuarios: alta, edicion y baja de usuarios con roles por app.

## Requisitos
- Node.js 18+ (recomendado 18.18 o 20.x)
- Supabase project configurado (solo DB, sin Supabase Auth).

## Configuracion
Crear `.env.local`:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Nota: el acceso a la DB se hace desde API routes con `SUPABASE_SERVICE_ROLE_KEY`.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`

## Documentacion
- `docs/SETUP.md`
- `docs/FEATURES.md`
- `docs/ARCHITECTURE.md`
- `docs/SUPABASE.md`
- `docs/SUPABASE_SNAPSHOT.md`
- `AGENTS.md`
