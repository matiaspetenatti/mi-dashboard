import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { createClient } from "@libsql/client"
import { config } from "dotenv"

config({ path: [".env.local", ".env"] })

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  throw new Error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN")
}

const client = createClient({ url, authToken })

try {
  const tablesResult = await client.execute(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name",
  )

  const tables = tablesResult.rows.map((row) => String(row.name))
  const counts: Record<string, number> = {}

  for (const table of tables) {
    const result = await client.execute(`select count(*) as total from "${table}"`)
    counts[table] = Number(result.rows[0]?.total ?? 0)
  }

  let migrations: Array<Record<string, unknown>> = []
  try {
    const result = await client.execute(
      "select id, hash, created_at from __drizzle_migrations order by id",
    )
    migrations = result.rows.map((row) => ({ ...row }))
  } catch {
    migrations = []
  }

  const report = {
    generatedAt: new Date().toISOString(),
    tableCount: tables.length,
    tables: counts,
    migrations,
  }

  const dir = join(process.cwd(), "backups")
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `db-audit-${Date.now()}.json`)
  writeFileSync(file, JSON.stringify(report, null, 2), "utf8")

  console.log(JSON.stringify(report, null, 2))
  console.log(`\nReporte guardado en ${file}`)
} finally {
  client.close()
}
