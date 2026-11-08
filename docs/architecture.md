# Arquitectura

## Capas

```text
routes/                 Pages: composición, loaders, guards
components/ui/          Primitivas shadcn/Base UI (átomos)
components/molecules/   Composiciones genéricas
components/organisms/   Bloques de app (sidebar, topbar, widgets)
components/templates/   Layouts (AppShell, ModulePage)
features/<modulo>/      Dominio: api, server, components, schemas, lib
server/                 DB, auth, cache, server functions transversales
lib/                    Utilidades puras
```

## Flujo de datos

```text
Componente
  → useQuery / useMutation
    → features/<modulo>/api.ts
      → createServerFn (RPC same-origin)
        → authMiddleware (Clerk + allowlist)
          → Zod
            → Drizzle → Turso
```

- Las rutas pueden ejecutarse en el cliente durante la navegación. Por eso los loaders no importan DB: solo llaman server functions.
- `authMiddleware` es la frontera de datos; el guard de `_app.tsx` es solo UX.
- Las mutaciones invalidan las query keys afectadas.
- Las APIs externas (Open-Meteo, Kitsu, Google Calendar) se llaman desde server functions y se cachean en el servidor.

## Autenticación

1. `clerkMiddleware()` en `src/start.ts` + CSRF para server functions.
2. `__root.tsx` envuelve la app con `AppClerkProvider` y `ThemeProvider`.
3. `_app.tsx` llama a `getViewer`; si no hay sesión redirige a `/sign-in`, si el email no está autorizado redirige a `/acceso-denegado`.
4. Cada server function de datos usa `authMiddleware`, que llama a `getAccess()` y falla cerrado.
5. `AUTHORIZED_EMAILS` es la única fuente de verdad del acceso. Los sign-ups públicos están deshabilitados.

## Base de datos

- `src/server/db/client.ts` crea el cliente libsql de forma lazy.
- `src/server/db/schema/` contiene las tablas existentes, portadas sin cambios.
- `drizzle/` conserva las migraciones históricas.
- El esquema actual coincide con Turso: `drizzle-kit generate` no genera cambios.
- Antes de un cambio de esquema: `npm run db:audit` y `npm run db:backup`.
- No ejecutar migraciones históricas contra la DB actual sin auditar `__drizzle_migrations`.

## Caché

- TanStack Query cachea en el cliente con `staleTime` por módulo.
- Open-Meteo se cachea en memoria 10 minutos en `features/clima/server/queries.ts`.
- Kitsu y Google Calendar tendrán su propia caché TTL al implementarse.

## Charts

- TanStack Charts (`@tanstack/charts` + `@tanstack/charts/react`) para todos los gráficos.
- No usar el componente `chart` de shadcn porque envuelve Recharts.
- Pasar `initialWidth` determinístico para SSR y memoizar las definiciones.

## Fases

1. Base + Inicio (hecho).
2. Tareas (núcleo hecho): proyectos, estados, vistas lista/tablero/tabla/calendario, detalle, subtareas, etiquetas, ajustes de proyecto y estadísticas. Pendientes: recurrencia, comentarios/adjuntos/dependencias, vistas guardadas y Google Calendar one-way.
3. Finanzas (núcleo hecho): cuentas, saldos, resumen mensual, evolución, categorías, movimientos y alta de movimientos/cuentas. Pendientes: reconciliación de rendimientos, importación y comparador.
4. Clima completo.
5. Estudio + calendario.
6. Animes + Kitsu.
7. Salud (migraña + bienestar).
8. Comida.
9. Hábitos (sección propia).
10. Polish, PWA y deploy final.
