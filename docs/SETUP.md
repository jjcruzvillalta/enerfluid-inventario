# Setup local

## 1) Instalar dependencias
```
npm install
```

## 2) Configurar variables
Crea `.env.local`:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3) Inicializar DB
- Ejecuta el SQL de `docs/SUPABASE.md` en Supabase.
- Aplica `supabase/seed.sql` para crear el admin inicial.

## 4) Levantar app
```
npm run dev
```

## 5) Verificar
- Ir a `http://localhost:3000`
- Iniciar sesion con usuario/clave

## Scripts utiles
- `npm run lint`
- `npm run build`

## Problemas comunes
- Si no carga datos, revisa las keys en `.env.local`.
- Si la API responde 403, verifica roles en `user_roles`.
