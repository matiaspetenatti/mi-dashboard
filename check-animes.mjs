import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

// load .env manually
const env = readFileSync("C:/Users/matias/Desktop/Repositorios/mi-dashboard/mi-dashboard/.env", "utf8");
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const r = await client.execute("SELECT COUNT(*) AS total FROM animes_vistos");
console.log("total:", r.rows[0].total);

const r2 = await client.execute("SELECT id, titulo, estado, favorito, tags FROM animes_vistos LIMIT 5");
console.log("sample:", JSON.stringify(r2.rows, null, 2));

// test the tags json_each query
try {
  const r3 = await client.execute("SELECT COUNT(*) AS c FROM animes_vistos WHERE EXISTS (SELECT 1 FROM json_each(tags) WHERE json_each.value = 'x')");
  console.log("tags exists query ok:", r3.rows[0].c);
} catch (e) {
  console.log("tags query ERROR:", e.message);
}

// test full filter query similar to drizzle
try {
  const r4 = await client.execute("SELECT COUNT(*) AS c FROM animes_vistos WHERE (titulo LIKE '%a%' OR titulo_ingles LIKE '%a%')");
  console.log("like query ok:", r4.rows[0].c);
} catch (e) {
  console.log("like query ERROR:", e.message);
}