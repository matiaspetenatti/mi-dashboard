import "@tanstack/react-start/server-only"

import { createClient, type Client } from "@libsql/client"
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql"

import { getServerEnv } from "@/server/env"
import * as schema from "./schema"

let client: Client | null = null
let database: LibSQLDatabase<typeof schema> | null = null

export function getDb(): LibSQLDatabase<typeof schema> {
  if (database) return database

  const env = getServerEnv()
  client = createClient({
    url: env.TURSO_DATABASE_URL.trim(),
    authToken: env.TURSO_AUTH_TOKEN.trim(),
  })
  database = drizzle(client, { schema })

  return database
}

export type Db = LibSQLDatabase<typeof schema>
