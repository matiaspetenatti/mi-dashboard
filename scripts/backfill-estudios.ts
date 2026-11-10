import { createClient } from "@libsql/client"
import { config } from "dotenv"

import { obtenerEstudio, normalizarEstudio } from "../src/features/animes/server/estudios"

config({ path: [".env.local", ".env"] })

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  throw new Error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN")
}

const client = createClient({ url, authToken })
const esperar = (ms: number) =>
  new Promise((resolver) => setTimeout(resolver, ms))

try {
  const pendientes = await client.execute(
    "select id, kitsu_id, titulo, titulo_ingles, ano from animes_vistos where estudio is null or trim(estudio) = '' order by id",
  )

  console.log(`Animes sin estudio: ${pendientes.rows.length}`)

  let actualizados = 0
  const sinDato: string[] = []

  for (const row of pendientes.rows) {
    const titulo = String(row.titulo ?? "")
    const tituloIngles = row.titulo_ingles
      ? String(row.titulo_ingles)
      : null
    const anio = row.ano !== null ? Number(row.ano) : null

    const estudio = await obtenerEstudio({
      kitsuId: Number(row.kitsu_id),
      titulos: [tituloIngles ?? "", titulo],
      anio,
    })

    if (!estudio) {
      sinDato.push(titulo)
      console.log(`- ${titulo}: sin dato`)
    } else {
      await client.execute({
        sql: "update animes_vistos set estudio = ? where id = ?",
        args: [estudio, Number(row.id)],
      })
      actualizados += 1
      console.log(`✓ ${titulo} -> ${estudio}`)
    }

    await esperar(400)
  }

  console.log(`\nActualizados: ${actualizados}/${pendientes.rows.length}`)
  if (sinDato.length > 0) {
    console.log("Sin dato:", sinDato)
  }

  const conEstudio = await client.execute(
    "select id, estudio from animes_vistos where estudio is not null and trim(estudio) <> ''",
  )

  let normalizados = 0
  for (const row of conEstudio.rows) {
    const actual = String(row.estudio ?? "")
    const normalizado = normalizarEstudio(actual)
    if (normalizado && normalizado !== actual) {
      await client.execute({
        sql: "update animes_vistos set estudio = ? where id = ?",
        args: [normalizado, Number(row.id)],
      })
      normalizados += 1
      console.log(`~ ${actual} -> ${normalizado}`)
    }
  }

  console.log(`Normalizados: ${normalizados}`)
} finally {
  client.close()
}
