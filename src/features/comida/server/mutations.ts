import "@tanstack/react-start/server-only"

import { and, eq, gte, lte, sql } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import {
  comidaIngredientes,
  comidaLista,
  comidaMenu,
  comidaRecetas,
  type MomentoMenu,
  type OrigenLista,
} from "@/server/db/schema"
import {
  buscarEnStock,
  calcularFaltantes,
  categoriaSugerida,
  proponerDescuento,
  stockBajo,
} from "../lib/inventario"
import {
  normalizarNombre,
  parsearIngredienteTexto,
  sumarCantidades,
} from "../lib/cantidades"
import { diasDeSemana, inicioSemana } from "../lib/semana"
import type {
  ActualizarItemComidaInput,
  ActualizarItemListaInput,
  ActualizarRecetaInput,
  CrearRecetaInput,
  ItemComidaInput,
  ItemListaInput,
  SlotMenuInput,
} from "../schemas"

function ahoraIso() {
  return new Date().toISOString()
}

function normalizarItem(input: ItemComidaInput) {
  if (input.tipo === "utensilio") {
    return {
      ...input,
      cantidad: 0,
      unidad: "unidad" as const,
      ubicacion: "bar" as const,
      caducaEn: null,
      stockMinimo: null,
    }
  }
  return input
}

export async function crearItemEnDb(input: ItemComidaInput) {
  const db = getDb()
  const datos = normalizarItem(input)
  const nombreNormalizado = normalizarNombre(datos.nombre)

  const existente = (
    await db
      .select({ id: comidaIngredientes.id })
      .from(comidaIngredientes)
      .where(eq(comidaIngredientes.nombreNormalizado, nombreNormalizado))
      .limit(1)
  ).at(0)

  if (existente) {
    throw new Error(
      `Ya tenés "${datos.nombre}" en la despensa. Editalo para cambiar la cantidad.`,
    )
  }

  const creado = (
    await db
      .insert(comidaIngredientes)
      .values({
        ...datos,
        nombreNormalizado,
        creadoEn: ahoraIso(),
      })
      .returning({ id: comidaIngredientes.id })
  ).at(0)

  if (!creado) throw new Error("No se pudo guardar el ítem")
  return { id: creado.id }
}

export async function actualizarItemEnDb(input: ActualizarItemComidaInput) {
  const db = getDb()
  const { id, ...resto } = input
  const datos = normalizarItem(resto)
  const nombreNormalizado = normalizarNombre(datos.nombre)

  const existente = (
    await db
      .select({ id: comidaIngredientes.id })
      .from(comidaIngredientes)
      .where(eq(comidaIngredientes.nombreNormalizado, nombreNormalizado))
      .limit(1)
  ).at(0)

  if (existente && existente.id !== id) {
    throw new Error(`Ya tenés "${datos.nombre}" en la despensa.`)
  }

  await db
    .update(comidaIngredientes)
    .set({ ...datos, nombreNormalizado, actualizadoEn: ahoraIso() })
    .where(eq(comidaIngredientes.id, id))

  return { ok: true }
}

export async function ajustarCantidadEnDb(id: number, cantidad: number) {
  const db = getDb()
  await db
    .update(comidaIngredientes)
    .set({
      cantidad: Number(cantidad.toFixed(3)),
      actualizadoEn: ahoraIso(),
    })
    .where(eq(comidaIngredientes.id, id))
  return { ok: true }
}

export async function eliminarItemEnDb(id: number) {
  const db = getDb()
  await db.delete(comidaIngredientes).where(eq(comidaIngredientes.id, id))
  return { ok: true }
}

function normalizarReceta(input: CrearRecetaInput) {
  return {
    ...input,
    ingredientes: input.ingredientes.map((ingrediente) => ({
      ...ingrediente,
      nombre: ingrediente.nombre.trim(),
      detalle: ingrediente.detalle?.trim() || null,
      ingredienteId: ingrediente.ingredienteId ?? null,
    })),
    pasos: input.pasos.map((paso) => paso.trim()).filter(Boolean),
    herramientas: input.herramientas
      .map((herramienta) => herramienta.trim())
      .filter(Boolean),
    tips: input.tips?.trim() || null,
    vaso: input.vaso?.trim() || null,
    tecnica: input.tecnica?.trim() || null,
  }
}

export async function crearRecetaEnDb(input: CrearRecetaInput) {
  const db = getDb()
  const datos = normalizarReceta(input)

  const creada = (
    await db
      .insert(comidaRecetas)
      .values({
        ...datos,
        favorita: false,
        vecesCocinada: 0,
        ultimaVezEn: null,
        creadoEn: ahoraIso(),
      })
      .returning({ id: comidaRecetas.id })
  ).at(0)

  if (!creada) throw new Error("No se pudo guardar la receta")
  return { id: creada.id }
}

export async function actualizarRecetaEnDb(input: ActualizarRecetaInput) {
  const db = getDb()
  const { id, ...resto } = input
  const datos = normalizarReceta({
    ...resto,
    origen: "manual",
    puntaje: 0,
  })

  await db
    .update(comidaRecetas)
    .set({
      titulo: datos.titulo,
      tipo: datos.tipo,
      tono: datos.tono,
      minutos: datos.minutos,
      porciones: datos.porciones,
      ingredientes: datos.ingredientes,
      pasos: datos.pasos,
      tips: datos.tips,
      nutricion: datos.nutricion,
      herramientas: datos.herramientas,
      vaso: datos.vaso,
      tecnica: datos.tecnica,
      actualizadoEn: ahoraIso(),
    })
    .where(eq(comidaRecetas.id, id))

  return { ok: true }
}

export async function alternarFavoritaEnDb(id: number, favorita: boolean) {
  const db = getDb()
  await db
    .update(comidaRecetas)
    .set({ favorita, actualizadoEn: ahoraIso() })
    .where(eq(comidaRecetas.id, id))
  return { ok: true }
}

export async function eliminarRecetaEnDb(id: number) {
  const db = getDb()
  await db.delete(comidaRecetas).where(eq(comidaRecetas.id, id))
  return { ok: true }
}

export async function cocinarRecetaEnDb(
  id: number,
  descontarStock: boolean,
) {
  const db = getDb()
  const ahora = ahoraIso()

  return db.transaction(async (tx) => {
    const receta = (
      await tx
        .select()
        .from(comidaRecetas)
        .where(eq(comidaRecetas.id, id))
        .limit(1)
    ).at(0)

    if (!receta) throw new Error("La receta no existe")

    let descontados = 0
    if (descontarStock) {
      const items = await tx.select().from(comidaIngredientes)
      const propuestas = proponerDescuento(receta.ingredientes, items)
      for (const propuesta of propuestas) {
        await tx
          .update(comidaIngredientes)
          .set({
            cantidad: sql`max(0, ${comidaIngredientes.cantidad} - ${propuesta.cantidad})`,
            actualizadoEn: ahora,
          })
          .where(eq(comidaIngredientes.id, propuesta.ingredienteId))
        descontados += 1
      }
    }

    await tx
      .update(comidaRecetas)
      .set({
        vecesCocinada: sql`${comidaRecetas.vecesCocinada} + 1`,
        ultimaVezEn: ahora,
        actualizadoEn: ahora,
      })
      .where(eq(comidaRecetas.id, id))

    return { ok: true, descontados }
  })
}

export async function guardarSlotEnDb(input: SlotMenuInput) {
  const db = getDb()
  const ahora = ahoraIso()

  let titulo = input.titulo?.trim() || null
  let minutos = input.minutos
  let ingredientes = input.ingredientes

  if (input.recetaId) {
    const receta = (
      await db
        .select()
        .from(comidaRecetas)
        .where(eq(comidaRecetas.id, input.recetaId))
        .limit(1)
    ).at(0)

    if (!receta) throw new Error("La receta no existe")
    titulo = receta.titulo
    minutos = receta.minutos
    ingredientes = receta.ingredientes.map((ingrediente) =>
      ingrediente.cantidad === null
        ? ingrediente.nombre
        : `${ingrediente.cantidad} ${ingrediente.unidad} de ${ingrediente.nombre}`,
    )
  }

  if (!titulo) throw new Error("Elegí una receta o escribí un título")

  const valores = {
    dia: input.dia,
    momento: input.momento,
    recetaId: input.recetaId,
    titulo,
    minutos,
    ingredientes,
    reutiliza: input.reutiliza?.trim() || null,
  }

  await db
    .insert(comidaMenu)
    .values({ ...valores, creadoEn: ahora })
    .onConflictDoUpdate({
      target: [comidaMenu.dia, comidaMenu.momento],
      set: { ...valores, actualizadoEn: ahora },
    })

  return { ok: true }
}

export async function alternarSlotHechoEnDb(
  dia: string,
  momento: MomentoMenu,
  hecho: boolean,
) {
  const db = getDb()
  await db
    .update(comidaMenu)
    .set({ hecho, actualizadoEn: ahoraIso() })
    .where(and(eq(comidaMenu.dia, dia), eq(comidaMenu.momento, momento)))
  return { ok: true }
}

export async function eliminarSlotEnDb(dia: string, momento: MomentoMenu) {
  const db = getDb()
  await db
    .delete(comidaMenu)
    .where(and(eq(comidaMenu.dia, dia), eq(comidaMenu.momento, momento)))
  return { ok: true }
}

export async function limpiarSemanaEnDb(semana: string) {
  const db = getDb()
  const inicio = inicioSemana(semana)
  const dias = diasDeSemana(inicio)
  const fin = dias[dias.length - 1]

  await db
    .delete(comidaMenu)
    .where(and(gte(comidaMenu.dia, inicio), lte(comidaMenu.dia, fin)))

  return { ok: true }
}

export async function crearItemListaEnDb(input: ItemListaInput) {
  const db = getDb()
  const creado = (
    await db
      .insert(comidaLista)
      .values({
        ...input,
        nombreNormalizado: normalizarNombre(input.nombre),
        origen: "manual",
        creadoEn: ahoraIso(),
      })
      .returning({ id: comidaLista.id })
  ).at(0)

  if (!creado) throw new Error("No se pudo agregar el ítem")
  return { id: creado.id }
}

export async function actualizarItemListaEnDb(
  input: ActualizarItemListaInput,
) {
  const db = getDb()
  const { id, ...datos } = input
  await db
    .update(comidaLista)
    .set({
      ...datos,
      nombreNormalizado: normalizarNombre(datos.nombre),
    })
    .where(eq(comidaLista.id, id))
  return { ok: true }
}

export async function alternarCompradoEnDb(id: number, comprado: boolean) {
  const db = getDb()
  const ahora = ahoraIso()

  const item = (
    await db.select().from(comidaLista).where(eq(comidaLista.id, id)).limit(1)
  ).at(0)

  if (!item) throw new Error("El ítem no existe")

  await db.transaction(async (tx) => {
    if (comprado) {
      const existente = (
        await tx
          .select()
          .from(comidaIngredientes)
          .where(
            eq(comidaIngredientes.nombreNormalizado, item.nombreNormalizado),
          )
          .limit(1)
      ).at(0)

      if (existente && existente.tipo === "ingrediente") {
        const suma = sumarCantidades(
          existente.cantidad,
          existente.unidad,
          item.cantidad,
          item.unidad,
        )
        await tx
          .update(comidaIngredientes)
          .set({
            cantidad: Number(suma.cantidad.toFixed(3)),
            unidad: suma.unidad,
            actualizadoEn: ahora,
          })
          .where(eq(comidaIngredientes.id, existente.id))
      } else if (!existente) {
        await tx.insert(comidaIngredientes).values({
          nombre: item.nombre,
          nombreNormalizado: item.nombreNormalizado,
          tipo: "ingrediente",
          categoria: item.categoria,
          cantidad: item.cantidad,
          unidad: item.unidad,
          ubicacion: item.categoria === "congelados" ? "freezer" : "despensa",
          creadoEn: ahora,
        })
      }
    }

    await tx
      .update(comidaLista)
      .set({ comprado, compradoEn: comprado ? ahora : null })
      .where(eq(comidaLista.id, id))
  })

  return { ok: true }
}

export async function eliminarItemListaEnDb(id: number) {
  const db = getDb()
  await db.delete(comidaLista).where(eq(comidaLista.id, id))
  return { ok: true }
}

export async function limpiarCompradosEnDb() {
  const db = getDb()
  await db.delete(comidaLista).where(eq(comidaLista.comprado, true))
  return { ok: true }
}

type FaltanteLista = {
  nombre: string
  cantidad: number
  unidad: string
  categoria: string
  origen: OrigenLista
  recetaId: number | null
}

async function insertarFaltantes(faltantes: FaltanteLista[]) {
  if (faltantes.length === 0) return 0

  const db = getDb()
  const pendientes = await db
    .select({ nombreNormalizado: comidaLista.nombreNormalizado })
    .from(comidaLista)
    .where(eq(comidaLista.comprado, false))

  const yaEstan = new Set(pendientes.map((item) => item.nombreNormalizado))
  const nuevos = faltantes.filter((faltante) => {
    const clave = normalizarNombre(faltante.nombre)
    if (yaEstan.has(clave)) return false
    yaEstan.add(clave)
    return true
  })

  if (nuevos.length === 0) return 0

  await db.insert(comidaLista).values(
    nuevos.map((faltante) => ({
      ...faltante,
      nombreNormalizado: normalizarNombre(faltante.nombre),
      creadoEn: ahoraIso(),
    })),
  )

  return nuevos.length
}

export async function agregarFaltantesRecetaEnDb(recetaId: number) {
  const db = getDb()
  const receta = (
    await db
      .select()
      .from(comidaRecetas)
      .where(eq(comidaRecetas.id, recetaId))
      .limit(1)
  ).at(0)

  if (!receta) throw new Error("La receta no existe")

  const items = await db.select().from(comidaIngredientes)
  const faltantes = calcularFaltantes(receta.ingredientes, items).filter(
    (faltante) => !faltante.opcional,
  )

  const agregados = await insertarFaltantes(
    faltantes.map((faltante) => ({
      nombre: faltante.nombre,
      cantidad: faltante.faltante ?? 1,
      unidad: faltante.unidadFaltante,
      categoria: categoriaSugerida(faltante.nombre),
      origen: "receta" as const,
      recetaId,
    })),
  )

  return { ok: true, agregados }
}

export async function agregarFaltantesMenuEnDb(semana: string) {
  const db = getDb()
  const inicio = inicioSemana(semana)
  const dias = diasDeSemana(inicio)
  const fin = dias[dias.length - 1]

  const [slots, items] = await Promise.all([
    db
      .select()
      .from(comidaMenu)
      .where(and(gte(comidaMenu.dia, inicio), lte(comidaMenu.dia, fin))),
    db.select().from(comidaIngredientes),
  ])

  if (slots.length === 0) {
    throw new Error("La semana todavía no tiene platos cargados")
  }

  const requeridos = new Map<
    string,
    { nombre: string; cantidad: number; unidad: string }
  >()

  for (const slot of slots) {
    for (const textoIngrediente of slot.ingredientes) {
      const parseado = parsearIngredienteTexto(textoIngrediente)
      if (!parseado.nombre) continue
      const clave = normalizarNombre(parseado.nombre)
      const existente = requeridos.get(clave)

      if (existente) {
        const suma = sumarCantidades(
          existente.cantidad,
          existente.unidad,
          parseado.cantidad ?? 1,
          parseado.unidad,
        )
        requeridos.set(clave, { nombre: existente.nombre, ...suma })
      } else {
        requeridos.set(clave, {
          nombre: parseado.nombre,
          cantidad: parseado.cantidad ?? 1,
          unidad: parseado.unidad,
        })
      }
    }
  }

  const faltantes: FaltanteLista[] = []

  for (const requerido of requeridos.values()) {
    const enStock = buscarEnStock(requerido.nombre, items)
    const cubierto =
      enStock &&
      (enStock.unidad === requerido.unidad
        ? enStock.cantidad >= requerido.cantidad
        : enStock.cantidad > 0)

    if (cubierto) continue

    faltantes.push({
      nombre: requerido.nombre,
      cantidad: enStock
        ? Math.max(0.01, requerido.cantidad - enStock.cantidad)
        : requerido.cantidad,
      unidad: requerido.unidad,
      categoria: categoriaSugerida(requerido.nombre),
      origen: "menu",
      recetaId: null,
    })
  }

  const agregados = await insertarFaltantes(faltantes)
  return { ok: true, agregados }
}

export async function agregarSugerenciasStockEnDb() {
  const db = getDb()
  const items = await db.select().from(comidaIngredientes)
  const bajos = stockBajo(items)

  const agregados = await insertarFaltantes(
    bajos.map((item) => ({
      nombre: item.nombre,
      cantidad: Math.max(1, (item.stockMinimo ?? 0) - item.cantidad),
      unidad: item.unidad,
      categoria: item.categoria,
      origen: "stock" as const,
      recetaId: null,
    })),
  )

  return { ok: true, agregados }
}
