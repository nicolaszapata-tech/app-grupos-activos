# Grupos Activos — Calidad Académica HE

App interna de Kuepa: muestra los grupos académicos activos (péndulo de
fechas apertura→cierre) y, por grupo, sus grabaciones de Meet clasificadas
en Oficiales / Coincidentes / Alterna / Extra contra el horario y el
calendario de festivos.

## Stack

Vite + React + Tailwind, datos en vivo desde Supabase (solo lectura, key
publicable). Login con Google (Identity Services) restringido a los
dominios `lanuevaamerica.edu.co` y `kuepa.edu.co` — es una barrera del lado
del cliente, no reemplaza RLS (ver `src/lib/auth.js`).

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar con los valores reales
npm run dev
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase "Seguimiento ETDH" |
| `VITE_SUPABASE_ANON_KEY` | Key publicable (anon), solo lectura vía RLS |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID (Web) para el botón "Sign in with Google" |
