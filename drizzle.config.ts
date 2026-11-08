import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: [".env.local", ".env"] })

export default defineConfig({
  dialect: "turso",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
})
