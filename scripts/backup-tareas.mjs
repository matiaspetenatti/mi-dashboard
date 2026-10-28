import fs from "node:fs";
import path from "node:path";
import env from "@next/env";
import { createClient } from "@libsql/client";

const { loadEnvConfig } = env;
loadEnvConfig(process.cwd());

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url) {
  console.error("Falta TURSO_DATABASE_URL");
  process.exit(1);
}

const client = createClient({ url, authToken });
const tablas = ["tareas", "grupos", "tags", "tareas_tags"];
const respaldo = { generadoEn: new Date().toISOString(), tablas: {} };

for (const tabla of tablas) {
  try {
    const resultado = await client.execute(`select * from ${tabla}`);
    respaldo.tablas[tabla] = resultado.rows;
    console.log(`${tabla}: ${resultado.rows.length} filas`);
  } catch (error) {
    respaldo.tablas[tabla] = [];
    console.warn(`${tabla}: no se pudo leer (${error.message})`);
  }
}

const carpeta = path.join(process.cwd(), "backups");
fs.mkdirSync(carpeta, { recursive: true });
const fecha = new Date().toISOString().slice(0, 10);
const destino = path.join(carpeta, `tareas-${fecha}.json`);
fs.writeFileSync(destino, JSON.stringify(respaldo, null, 2), "utf8");
console.log(`Respaldo guardado en ${destino}`);

client.close();
