import "@tanstack/react-start/server-only"

import { z } from "zod"

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1, "TURSO_DATABASE_URL es obligatorio"),
  TURSO_AUTH_TOKEN: z.string().min(1, "TURSO_AUTH_TOKEN es obligatorio"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY es obligatorio"),
  CLERK_ENCRYPTION_KEY: z.string().min(1).optional(),
  AUTHORIZED_EMAILS: z.string().min(1, "AUTHORIZED_EMAILS es obligatorio"),
})

export type ServerEnv = z.infer<typeof envSchema>

let cachedEnv: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const detalle = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")
    throw new Error(`Variables de entorno inválidas. ${detalle}`)
  }

  cachedEnv = parsed.data
  return cachedEnv
}

export function getAuthorizedEmails(): Set<string> {
  return new Set(
    getServerEnv()
      .AUTHORIZED_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}
