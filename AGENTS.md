# mi-dashboard

Panel personal con módulos de tareas, finanzas, estudio, animes, clima, salud, comida y hábitos.

## Stack

- TanStack Start + TanStack Router + TanStack Query (React 19, Vite)
- TanStack Table y TanStack Charts
- Clerk (`@clerk/tanstack-react-start`) para autenticación
- Turso + Drizzle ORM (`@libsql/client`)
- shadcn/ui (Base UI) + Tailwind CSS 4
- Zod y React Hook Form
- Vitest + Testing Library

## Estructura

```text
src/
├─ routes/                 # Pages de TanStack Router (composición + loaders)
├─ components/
│  ├─ ui/                  # Primitivas shadcn/Base UI (capa de átomos)
│  ├─ molecules/           # Composiciones genéricas
│  ├─ organisms/           # Sidebar, topbar, widget-card, page-header...
│  ├─ templates/           # AppShell, ModulePage, AuthShell
│  └─ providers/           # Clerk, tema
├─ features/<modulo>/
│  ├─ server/              # Queries Drizzle + server functions
│  ├─ api.ts               # queryOptions/mutations para el cliente
│  ├─ components/          # Componentes de dominio
│  ├─ schemas.ts           # Zod compartido
│  └─ lib/
├─ server/
│  ├─ db/                  # Cliente libsql + esquema Drizzle
│  ├─ auth/                # Acceso, allowlist y middleware
│  ├─ cache/               # TTL para APIs externas
│  └─ functions/           # Server functions transversales
├─ lib/                    # env, fechas, formato, módulos
├─ styles/app.css          # Tokens Wise + Tailwind + shadcn
├─ router.tsx
└─ start.ts                # CSRF + Clerk middleware
```

La UI genérica vive en `components/ui` (átomos shadcn). `molecules`, `organisms` y `templates` se construyen encima. Las rutas son las “pages” y solo componen features.

## Regla de datos

**El front-end nunca accede a la base de datos.**

```text
Componente / ruta
  → features/<modulo>/api.ts (TanStack Query)
    → createServerFn (RPC)
      → authMiddleware (Clerk + AUTHORIZED_EMAILS)
        → validación Zod
          → Drizzle / Turso
```

- Toda lectura o escritura va por `createServerFn`.
- Las server functions de datos llevan `.middleware([authMiddleware])`.
- Validar siempre la entrada con Zod.
- Los loaders de rutas pueden ejecutarse en el cliente durante la navegación: nunca importan `@/server/db` ni `server/*`.
- Usar `import "@tanstack/react-start/server-only"` en módulos puramente del servidor (`queries.ts`, `crear.ts`, `access.ts`, `db/client.ts`). **No** usarlo en los módulos de server functions que importa el cliente; para esos, importar las dependencias del servidor con `await import(...)` dentro del handler.
- No usar `verbatimModuleSyntax: true` en `tsconfig.json`: hace que el bundle del servidor se filtre al cliente.

## Autenticación

- Clerk Core 3 con `clerkMiddleware()` en `src/start.ts`.
- El acceso se resuelve en `getAccess()` y se limita a `AUTHORIZED_EMAILS` (coma-separado, fail closed).
- `_app.tsx` protege la UX; `authMiddleware` protege los datos.
- Los sign-ups públicos están deshabilitados. Solo el email autorizado puede entrar.
- `getViewer` es la server function pública que usa el guard de rutas.

## Base de datos

- Esquema: `src/server/db/schema/*.ts`, re-exportado desde `schema/index.ts`.
- Migraciones: `drizzle/` (no editar SQL a mano).
- Flujo: cambiar schema → `npm run db:generate` → revisar SQL → `npm run db:migrate`.
- Antes de tocar el esquema: `npm run db:audit` y `npm run db:backup`.
- El esquema actual está sincronizado con Turso: `db:generate` debe decir “No schema changes”.
- Hay tablas legacy (`comida_registros`, `salud_perfil_peso`, `salud_pesos`) que no están en el esquema; no se usan y no se deben borrar.

## Diseño

- Tokens Wise claro/oscuro en `src/styles/app.css`.
- Referencia visual: `DESIGN.md` y el proyecto Stitch “Dashboard Design System Redesign”.
- Display: Inter 900 con tracking negativo. Cuerpo: Inter.
- Botones y tags: pill. Cards: 10px; cards grandes: 28px.
- Acción primaria: lima (`bg-lime-voltage text-forest-ink`).
- No usar gradientes ni sombras decorativas.
- Usar siempre los componentes de shadcn/ui de `components/ui` cuando exista un equivalente (`Select`, `Checkbox`, `Dialog`, `Input`, `Button`, etc.). Evitar controles nativos como `<select>` salvo que no haya un componente adecuado.
- shadcn/ui genera las primitivas en `components/ui`. No instalar el componente `chart` de shadcn: los gráficos son **TanStack Charts** (`@tanstack/charts/react`).
- `components.json`: `style: "base-nova"`, `rsc: false`, `css: "src/styles/app.css"`.

## Comandos

```bash
npm run dev          # Vite en :3000
npm run build        # build de producción
npm run start        # preview del build
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm test             # Vitest
npm run db:generate  # generar migración
npm run db:migrate   # aplicar migraciones
npm run db:studio    # Drizzle Studio
npm run db:audit     # auditoría read-only de Turso
npm run db:backup    # backup JSON en backups/
```

## Variables de entorno

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
CLERK_SECRET_KEY=
CLERK_ENCRYPTION_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
AUTHORIZED_EMAILS=
```

Las variables con prefijo `VITE_` son públicas. El resto es solo servidor.

## Reglas para agentes

- Antes de terminar: `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`.
- Mantener el código y los textos en español; nombres de dominio en español.
- Priorizar siempre los componentes de shadcn/ui de `components/ui` sobre controles nativos cuando exista un equivalente.
- No romper el límite servidor/cliente: si aparece un error de import-protection, mover la dependencia del servidor a un `await import()` dentro del handler.
- No exponer secretos en componentes ni en variables `VITE_`.
- No cambiar el esquema sin backup y auditoría previa.
- Actualizar este archivo si cambia la arquitectura o los comandos.
