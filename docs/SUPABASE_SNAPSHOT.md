# Snapshot de Supabase

Este proyecto no usa Supabase Auth. El estado de la base se puede versionar con un snapshot de esquema
para mantener sincronizado el repositorio con la base real.

## Opcion A (recomendada): Supabase CLI

1) Instala/usa el CLI
```
npx supabase --version
```

2) Vincula el proyecto (solo una vez)
```
npx supabase link --project-ref TU_REF
```

3) Genera snapshot del esquema
```
npx supabase db dump --schema-only --file supabase/schema.sql
```
o
```
npm run db:snapshot
```

4) (Opcional) Genera una migracion con el estado actual
```
npx supabase db pull
```

Commit recomendado:
```
git add supabase/schema.sql supabase/migrations
git commit -m "chore: snapshot supabase schema"
```

## Opcion B: PG dump directo

Usa la cadena `SUPABASE_DB_URL` desde Supabase (Settings > Database).

PowerShell:
```
$env:SUPABASE_DB_URL="postgresql://..."
npx supabase db dump --schema-only --file supabase/schema.sql
```

Bash:
```
SUPABASE_DB_URL="postgresql://..." npx supabase db dump --schema-only --file supabase/schema.sql
```

## Frecuencia sugerida
- Cada cambio de tablas/policies: genera snapshot y commit.
- Antes de releases o migraciones grandes.

## Buenas practicas
- No versionar datos sensibles.
- Si necesitas semilla, usa `supabase/seed.sql` con usuarios de ejemplo.
