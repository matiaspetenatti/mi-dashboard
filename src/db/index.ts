import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema.ts";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url) {
  throw new Error(
    "Falta la variable de entorno TURSO_DATABASE_URL (debe empezar con libsql://).",
  );
}

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
