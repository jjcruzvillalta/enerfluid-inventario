# Enerfluid Inventario

Panel de analisis y reposicion basado en datos cargados desde Excel y almacenados en Supabase.

## Requisitos

- Node.js 20+
- Proyecto Supabase configurado (tablas, auth y Edge Function `upload-excel`)

## Configuracion

1) Edita `public/supabase-config.js`:
   - `url`: Project URL de Supabase
   - `anonKey`: anon public key

2) En Supabase:
   - Crea el usuario en Auth (email/password).
   - Asegura la Edge Function `upload-excel` con sus secrets.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Flujo de uso

1) Inicia sesion en la app.
2) Sube los Excel en la pestaña de carga.
3) Revisa analisis y reposicion.

## Reposicion (resumen)

- Consumo mensual basado en egresos dentro de la ventana seleccionada.
- Minimo de compra = lead time (meses) + colchon.
- Si cobertura <= minimo, compra para llegar al objetivo (meses).

## CI

GitHub Actions ejecuta:
- `npm run lint`
- `npm run test`
- `npm run build`
