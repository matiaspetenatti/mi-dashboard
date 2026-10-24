# mi-dashboard

Panel personal con módulos: tareas, finanzas, estudio, animes y clima.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4
- Autenticación: Clerk
- Base de datos: Drizzle ORM + libsql (Turso); migraciones en `/drizzle`
- Validación: Zod
- UI: componentes tipo shadcn en `src/components/ui`, `class-variance-authority`, utilidad `cn()`
- Animaciones: motion

## Estructura de carpetas

src/
app/ # App Router: rutas, route group (app), API routes, páginas de auth (Clerk)
components/ # UI compartida: ui/, motion/, sidebar, theme-toggle, widget-card, page-header
lib/ # auth, utils, format, modules (registro central de módulos)
db/ # schema.ts, index.ts (cliente de Drizzle)
modules/ # un módulo por característica (tareas, finanzas, estudio, animes, clima)
types/ # tipos globales (si los hay)
drizzle/ # migraciones SQL generadas por drizzle-kit (no editar a mano)
scripts/ # scripts de seed e importación (uno por propósito)
.env / .env.local # variables de entorno (no commitear .env.local)

## Convenciones de código

- Idioma: español para nombres de variables, funciones, componentes, rutas y comentarios.
- Importaciones: usar el alias `@/*` → `./src/*`. Evitar rutas relativas profundas (`../../`).
- Cada módulo bajo `src/modules/<modulo>/` con:
  schema.ts # definición de tablas Drizzle
  queries.ts # lecturas de base de datos (server-only)
  actions.ts # Server Actions (`"use server"`)
  contenido.tsx # página principal del módulo
  widget.tsx # tarjeta de resumen para el dashboard
  constantes.ts # valores fijos del módulo
  componentes propios bajo components/ si el módulo crece
  subcarpetas actions/, queries/, lib/ cuando justifiquen la separación (ver módulo animes)
- Server actions: iniciar con `"use server"`, llamar `requireAuthorizedUser()`, validar con Zod, y al terminar revalidar caché (`revalidatePath` / `updateTag`).
- Páginas cliente: agregar `"use client"` solo cuando sea estrictamente necesario (interactividad).
- Estilos: Tailwind con tokens de tema (`primary`, `secondary`, `tertiary`); usar `cn()` y `cva()` para variantes.
- Componentes de base en `src/components/ui/`; no modificar archivos de UI generados salvo ajustes de tema.

## Base de datos

- No editar los archivos SQL de `/drizzle` manualmente.
- Flujo: modificar `schema.ts` → `npm run db:generate` → `npm run db:migrate`.
- `npm run db:studio` para inspeccionar datos.

## Comandos disponibles

- `npm run dev` # desarrollo con Turbopack
- `npm run build` # build de producción
- `npm run start` # servidor de producción
- `npm run lint` # ESLint

## Cómo agregar un módulo nuevo

1. Crear `src/modules/<modulo>/` con `schema.ts`, `queries.ts`, `actions.ts`, `contenido.tsx`, `widget.tsx`.
2. Registrar el módulo en `src/lib/modules.ts` (slug, label, href, icon, accent).
3. Añadir la ruta en `src/app/(app)/<modulo>/page.tsx` (o según corresponda).
4. Agregar la navegación en el sidebar si aplica.
5. Generar y aplicar la migración: `npm run db:generate` y `npm run db:migrate`.
6. Documentar variables de entorno nuevas en `.env.example`.

## Variables de entorno

Requeridas (ver `.env`): `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`.

## Reglas para agentes que trabajan en este repo

- Antes de dar por terminada una tarea: ejecutar `npm run lint` y verificar tipos (`tsc --noEmit` o `next build` si se tocaron rutas).
- No romper Server Actions existentes; todas las mutaciones deben incluir `requireAuthorizedUser()`.
- Si cambia `schema.ts`, generar y aplicar la migración correspondiente.
- Mantener el código en español y seguir la estructura de módulos existente.
