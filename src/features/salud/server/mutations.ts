import "@tanstack/react-start/server-only"

import { eq } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import {
  saludEpisodios,
  saludEpisodioDesencadenantes,
  saludRegistrosDiarios,
} from "@/server/db/schema"
import {
  SLUGS_AURA,
  SLUGS_FACTORES,
  SLUGS_SINTOMAS,
} from "../constantes"
import { compararFechaHora } from "../lib/fechas"
import type {
  ActualizarEpisodioInput,
  CrearEpisodioInput,
  GuardarRegistroDiarioInput,
} from "../schemas"

function normalizarEpisodio(input: CrearEpisodioInput) {
  const factores = [
    ...new Set(input.factores.filter((factor) => SLUGS_FACTORES.has(factor))),
  ]

  const { factores: _factores, ...resto } = input

  return {
    factores,
    datos: {
      ...resto,
      auraTipos: resto.aura
        ? resto.auraTipos.filter((tipo) => SLUGS_AURA.has(tipo))
        : [],
      sintomas: resto.sintomas.filter((sintoma) =>
        SLUGS_SINTOMAS.has(sintoma),
      ),
      dosisTetralgin: resto.tomoTetralgin ? resto.dosisTetralgin : null,
      tetralginEn: resto.tomoTetralgin ? resto.tetralginEn : null,
      alivio: resto.tomoTetralgin ? resto.alivio : null,
    },
  }
}

export async function crearEpisodioEnDb(input: CrearEpisodioInput) {
  const db = getDb()
  const { datos, factores } = normalizarEpisodio(input)
  const ahora = new Date().toISOString()

  return db.transaction(async (tx) => {
    const creado = (
      await tx
        .insert(saludEpisodios)
        .values({ ...datos, creadoEn: ahora })
        .returning({ id: saludEpisodios.id })
    ).at(0)

    if (!creado) throw new Error("No se pudo guardar el episodio")

    if (factores.length > 0) {
      await tx
        .insert(saludEpisodioDesencadenantes)
        .values(factores.map((factor) => ({ episodioId: creado.id, factor })))
    }

    return { id: creado.id }
  })
}

export async function actualizarEpisodioEnDb(
  input: ActualizarEpisodioInput,
) {
  const db = getDb()
  const { id, ...resto } = input
  const { datos, factores } = normalizarEpisodio(resto)
  const ahora = new Date().toISOString()

  return db.transaction(async (tx) => {
    await tx
      .update(saludEpisodios)
      .set({ ...datos, actualizadoEn: ahora })
      .where(eq(saludEpisodios.id, id))

    await tx
      .delete(saludEpisodioDesencadenantes)
      .where(eq(saludEpisodioDesencadenantes.episodioId, id))

    if (factores.length > 0) {
      await tx
        .insert(saludEpisodioDesencadenantes)
        .values(factores.map((factor) => ({ episodioId: id, factor })))
    }

    return { ok: true }
  })
}

export async function cerrarEpisodioEnDb({
  id,
  finEn,
}: {
  id: number
  finEn: string
}) {
  const db = getDb()
  const episodio = (
    await db
      .select({ inicioEn: saludEpisodios.inicioEn })
      .from(saludEpisodios)
      .where(eq(saludEpisodios.id, id))
      .limit(1)
  ).at(0)

  if (!episodio) throw new Error("El episodio no existe")
  if (compararFechaHora(finEn, episodio.inicioEn) <= 0) {
    throw new Error("El cierre tiene que ser posterior al inicio")
  }

  await db
    .update(saludEpisodios)
    .set({ finEn, actualizadoEn: new Date().toISOString() })
    .where(eq(saludEpisodios.id, id))

  return { ok: true }
}

export async function eliminarEpisodioEnDb(id: number) {
  const db = getDb()
  await db.delete(saludEpisodios).where(eq(saludEpisodios.id, id))
  return { ok: true }
}

export async function guardarRegistroDiarioEnDb(
  input: GuardarRegistroDiarioInput,
) {
  const db = getDb()
  const { fecha, ...valores } = input
  const ahora = new Date().toISOString()

  await db
    .insert(saludRegistrosDiarios)
    .values({ fecha, ...valores, creadoEn: ahora })
    .onConflictDoUpdate({
      target: saludRegistrosDiarios.fecha,
      set: { ...valores, actualizadoEn: ahora },
    })

  return { ok: true }
}

export async function eliminarRegistroDiarioEnDb(id: number) {
  const db = getDb()
  await db
    .delete(saludRegistrosDiarios)
    .where(eq(saludRegistrosDiarios.id, id))
  return { ok: true }
}
