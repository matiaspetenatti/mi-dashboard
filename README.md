# Mi Dashboard

Panel personal para tener a mano tareas, finanzas, estudio, animes, clima, salud, comida y hábitos.

## Stack

- **TanStack Start** (React 19 + Vite) con Router, Query, Table y Charts
- **Clerk** para autenticación (un solo email autorizado)
- **Turso** + Drizzle ORM
- **shadcn/ui** (Base UI) + Tailwind CSS 4
- Zod + React Hook Form

## Empezar

```bash
npm install
cp .env.example .env
# completar Turso, Clerk y AUTHORIZED_EMAILS
npm run dev
```

Abrí `http://localhost:3000`.

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

`AUTHORIZED_EMAILS` acepta varios emails separados por coma. Si está vacío, nadie puede entrar.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `:3000` |
| `npm run build` | Build de producción |
| `npm run start` | Preview del build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run db:generate` | Genera migración Drizzle |
| `npm run db:migrate` | Aplica migraciones |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:audit` | Auditoría read-only de Turso |
| `npm run db:backup` | Backup JSON en `backups/` |

## Estructura

- `src/routes`: páginas de TanStack Router.
- `src/components/ui`: primitivas shadcn/Base UI.
- `src/components/{molecules,organisms,templates}`: diseño atómico.
- `src/features/<modulo>`: lógica y componentes de cada módulo.
- `src/server`: DB, auth y server functions.
- `src/styles/app.css`: tokens Wise claro/oscuro.

El front-end **nunca** accede a la base de datos: todo pasa por server functions con auth y Zod.

## Estado

Fase 1 completada: shell, autenticación, Turso, design system, Inicio con datos reales y quick add de tareas. Los módulos restantes están en construcción y se irán portando por fases.

## Deploy

Pensado para Vercel con Nitro. Configurar las variables de entorno en el proyecto de Vercel y usar un preview antes de producción.
