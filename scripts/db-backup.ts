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
  const dump: Record<string, Array<Record<string, unknown>>> = {}

  for (const table of tables) {
    const result = await client.execute(`select * from "${table}"`)
    dump[table] = result.rows.map((row) => ({ ...row }))
  }

  const dir = join(process.cwd(), "backups")
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `db-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
  writeFileSync(
    file,
    JSON.stringify({ generatedAt: new Date().toISOString(), tables: dump }, null, 2),
    "utf8",
  )

  console.log(`Backup de ${tables.length} tablas guardado en ${file}`)
} finally {
  client.close()
}
