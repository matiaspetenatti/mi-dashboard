"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import {
  normalizarNombre,
  parsearIngredienteTexto,
  sumarCantidades,
} from "../lib/cantidades";
import {
  buscarEnStock,
  calcularFaltantes,
  categoriaSugerida,
  stockBajo,
} from "../lib/inventario";
import { invalidarComida } from "../lib/invalidar";
import { diasDeSemana, inicioSemana, REGEX_FECHA } from "../lib/semana";
import {
  comidaIngredientes,
  comidaLista,
  comidaMenu,
  comidaRecetas,
  type OrigenLista,
} from "../schema";
import {
  idValido,
  numero,
  primerError,
  texto,
  type ResultadoAccion,
} from "./tipos";

const CATEGORIAS = [
  "carnes",
  "verduras",
  "frutas",
  "lacteos",
  "almacen",
  "bebidas",
  "congelados",
  "preparadas",
  "bar",
  "otros",
] as const;

const listaSchema = z.object({
  nombre: z.string().trim().min(2, "Poné un nombre de al menos 2 letras").max(120),
  cantidad: z.number().min(0.01, "La cantidad tiene que ser mayor a cero"),
  unidad: z.string().trim().min(1),
  categoria: z.enum(CATEGORIAS),
  precioCentavos: z.number().int().min(0).nullable(),
});

function leerDatos(formData: FormData) {
  // El formulario pide el precio en pesos; la base lo guarda en centavos.
  const precio = numero(formData, "precio");

  return {
    nombre: texto(formData, "nombre"),
    cantidad: numero(formData, "cantidad") ?? 1,
    unidad: texto(formData, "unidad") || "unidad",
    categoria: texto(formData, "categoria") || "otros",
    precioCentavos: precio === null ? null : Math.round(precio * 100),
  };
}

function validar(formData: FormData) {
  const parsed = listaSchema.safeParse(leerDatos(formData));
  if (!parsed.success) {
    return { ok: false as const, error: primerError(parsed.error) };
  }
  return { ok: true as const, datos: parsed.data };
}

/** Agrega un ítem manual a la lista de compras. */
export async function agregarItemLista(
  formData: FormData,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const resultado = validar(formData);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  const { datos } = resultado;
  const nombreNormalizado = normalizarNombre(datos.nombre);

  try {
    const [creado] = await db
      .insert(comidaLista)
      .values({
        ...datos,
        nombreNormalizado,
        origen: "manual",
        creadoEn: new Date().toISOString(),
      })
      .returning({ id: comidaLista.id });

    invalidarComida();
    return { ok: true, id: creado.id };
  } catch (error) {
    console.error("[comida] Error al agregar a la lista:", error);
    return { ok: false, error: "No se pudo agregar el ítem a la lista" };
  }
}

/** Edita nombre, cantidad, unidad, categoría y precio de un ítem. */
export async function actualizarItemLista(
  id: number,
  formData: FormData,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Ítem inválido" };

  const resultado = validar(formData);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  try {
    await db
      .update(comidaLista)
      .set({
        ...resultado.datos,
        nombreNormalizado: normalizarNombre(resultado.datos.nombre),
      })
      .where(eq(comidaLista.id, id));

    invalidarComida();
    return { ok: true, id };
  } catch (error) {
    console.error("[comida] Error al actualizar la lista:", error);
    return { ok: false, error: "No se pudo actualizar el ítem" };
  }
}

/** Atajo para el precio editable de la tabla. */
export async function actualizarPrecioLista(
  id: number,
  precioCentavos: number | null,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Ítem inválido" };
  if (precioCentavos !== null && (!Number.isInteger(precioCentavos) || precioCentavos < 0)) {
    return { ok: false, error: "Precio inválido" };
  }

  try {
    await db
      .update(comidaLista)
      .set({ precioCentavos })
      .where(eq(comidaLista.id, id));

    invalidarComida();
    return { ok: true, id };
  } catch (error) {
    console.error("[comida] Error al actualizar el precio:", error);
    return { ok: false, error: "No se pudo guardar el precio" };
  }
}

/**
 * Marca o desmarca un ítem. Al marcarlo, repone el inventario: si el
 * ingrediente ya existe se suma la cantidad; si no, se crea.
 * Desmarcar no resta stock (ya podría estar consumido).
 */
export async function alternarComprado(
  id: number,
  comprado: boolean,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Ítem inválido" };

  try {
    const [item] = await db
      .select()
      .from(comidaLista)
      .where(eq(comidaLista.id, id))
      .limit(1);

    if (!item) return { ok: false, error: "El ítem no existe" };

    await db.transaction(async (tx) => {
      if (comprado) {
        const existente = await tx
          .select()
          .from(comidaIngredientes)
          .where(
            eq(comidaIngredientes.nombreNormalizado, item.nombreNormalizado),
          )
          .limit(1);

        if (existente.length > 0 && existente[0].tipo === "ingrediente") {
          const suma = sumarCantidades(
            existente[0].cantidad,
            existente[0].unidad,
            item.cantidad,
            item.unidad,
          );

          await tx
            .update(comidaIngredientes)
            .set({
              cantidad: Number(suma.cantidad.toFixed(3)),
              unidad: suma.unidad,
              actualizadoEn: new Date().toISOString(),
            })
            .where(eq(comidaIngredientes.id, existente[0].id));
        } else if (existente.length === 0) {
          await tx.insert(comidaIngredientes).values({
            nombre: item.nombre,
            nombreNormalizado: item.nombreNormalizado,
            tipo: "ingrediente",
            categoria: item.categoria,
            cantidad: item.cantidad,
            unidad: item.unidad,
            ubicacion: item.categoria === "congelados" ? "freezer" : "despensa",
            creadoEn: new Date().toISOString(),
          });
        }
      }

      await tx
        .update(comidaLista)
        .set({
          comprado,
          compradoEn: comprado ? new Date().toISOString() : null,
        })
        .where(eq(comidaLista.id, id));
    });

    invalidarComida();
    return { ok: true, id };
  } catch (error) {
    console.error("[comida] Error al marcar comprado:", error);
    return { ok: false, error: "No se pudo actualizar la compra" };
  }
}

export async function eliminarItemLista(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Ítem inválido" };

  try {
    await db.delete(comidaLista).where(eq(comidaLista.id, id));
    invalidarComida();
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al eliminar de la lista:", error);
    return { ok: false, error: "No se pudo eliminar el ítem" };
  }
}

export async function limpiarComprados(): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  try {
    await db.delete(comidaLista).where(eq(comidaLista.comprado, true));
    invalidarComida();
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al limpiar comprados:", error);
    return { ok: false, error: "No se pudieron limpiar los comprados" };
  }
}

type FaltanteLista = {
  nombre: string;
  cantidad: number;
  unidad: string;
  categoria: string;
  origen: OrigenLista;
  recetaId: number | null;
};

/**
 * Inserta faltantes evitando duplicar ítems pendientes que ya están en la
 * lista con el mismo nombre.
 */
async function insertarFaltantes(faltantes: FaltanteLista[]) {
  if (faltantes.length === 0) return 0;

  const pendientes = await db
    .select({ nombreNormalizado: comidaLista.nombreNormalizado })
    .from(comidaLista)
    .where(eq(comidaLista.comprado, false));

  const yaEstan = new Set(pendientes.map((item) => item.nombreNormalizado));
  const nuevos = faltantes.filter((faltante) => {
    const clave = normalizarNombre(faltante.nombre);
    if (yaEstan.has(clave)) return false;
    yaEstan.add(clave);
    return true;
  });

  if (nuevos.length === 0) return 0;

  await db.insert(comidaLista).values(
    nuevos.map((faltante) => ({
      ...faltante,
      nombreNormalizado: normalizarNombre(faltante.nombre),
      creadoEn: new Date().toISOString(),
    })),
  );

  return nuevos.length;
}

/** Vuelca a la lista los ingredientes que faltan para una receta. */
export async function agregarFaltantesReceta(
  recetaId: number,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(recetaId)) return { ok: false, error: "Receta inválida" };

  try {
    const [receta] = await db
      .select()
      .from(comidaRecetas)
      .where(eq(comidaRecetas.id, recetaId))
      .limit(1);

    if (!receta) return { ok: false, error: "La receta no existe" };

    const items = await db.select().from(comidaIngredientes);
    const faltantes = calcularFaltantes(receta.ingredientes, items).filter(
      (faltante) => !faltante.opcional,
    );

    const agregados = await insertarFaltantes(
      faltantes.map((faltante) => ({
        nombre: faltante.nombre,
        cantidad: faltante.faltante ?? 1,
        unidad: faltante.unidadFaltante,
        categoria: categoriaSugerida(faltante.nombre),
        origen: "receta" as const,
        recetaId,
      })),
    );

    invalidarComida();
    return { ok: true, agregados };
  } catch (error) {
    console.error("[comida] Error al agregar faltantes de receta:", error);
    return { ok: false, error: "No se pudieron agregar los faltantes" };
  }
}

/**
 * Vuelca a la lista los ingredientes del menú semanal que no estén en stock.
 * Los textos del menú vienen como "500 g de pollo" y se parsean.
 */
export async function agregarFaltantesMenu(
  semana: string,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!REGEX_FECHA.test(semana)) {
    return { ok: false, error: "Semana inválida" };
  }

  const inicio = inicioSemana(semana);
  const dias = diasDeSemana(inicio);
  const fin = dias[dias.length - 1];

  try {
    const [slots, items] = await Promise.all([
      db
        .select()
        .from(comidaMenu)
        .where(and(gte(comidaMenu.dia, inicio), lte(comidaMenu.dia, fin))),
      db.select().from(comidaIngredientes),
    ]);

    if (slots.length === 0) {
      return { ok: false, error: "La semana todavía no tiene platos cargados" };
    }

    // Suma los requerimientos por nombre para no repetir el mismo ítem.
    const requeridos = new Map<
      string,
      { nombre: string; cantidad: number; unidad: string }
    >();

    for (const slot of slots) {
      for (const textoIngrediente of slot.ingredientes) {
        const parseado = parsearIngredienteTexto(textoIngrediente);
        if (!parseado.nombre) continue;
        const clave = normalizarNombre(parseado.nombre);
        const existente = requeridos.get(clave);

        if (existente) {
          const suma = sumarCantidades(
            existente.cantidad,
            existente.unidad,
            parseado.cantidad ?? 1,
            parseado.unidad,
          );
          requeridos.set(clave, { nombre: existente.nombre, ...suma });
        } else {
          requeridos.set(clave, {
            nombre: parseado.nombre,
            cantidad: parseado.cantidad ?? 1,
            unidad: parseado.unidad,
          });
        }
      }
    }

    const faltantes: FaltanteLista[] = [];

    for (const requerido of requeridos.values()) {
      const enStock = buscarEnStock(requerido.nombre, items);
      const cubierto =
        enStock &&
        (enStock.unidad === requerido.unidad
          ? enStock.cantidad >= requerido.cantidad
          : enStock.cantidad > 0);

      if (cubierto) continue;

      faltantes.push({
        nombre: requerido.nombre,
        cantidad: enStock
          ? Math.max(0.01, requerido.cantidad - enStock.cantidad)
          : requerido.cantidad,
        unidad: requerido.unidad,
        categoria: categoriaSugerida(requerido.nombre),
        origen: "menu",
        recetaId: null,
      });
    }

    const agregados = await insertarFaltantes(faltantes);
    invalidarComida();
    return { ok: true, agregados };
  } catch (error) {
    console.error("[comida] Error al agregar faltantes del menú:", error);
    return { ok: false, error: "No se pudieron agregar los faltantes del menú" };
  }
}

/** Agrega a la lista los ingredientes que están en el stock mínimo. */
export async function agregarSugerenciasStock(): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  try {
    const items = await db.select().from(comidaIngredientes);
    const bajos = stockBajo(items);

    const agregados = await insertarFaltantes(
      bajos.map((item) => ({
        nombre: item.nombre,
        cantidad: Math.max(1, (item.stockMinimo ?? 0) - item.cantidad),
        unidad: item.unidad,
        categoria: item.categoria,
        origen: "stock" as const,
        recetaId: null,
      })),
    );

    invalidarComida();
    return { ok: true, agregados };
  } catch (error) {
    console.error("[comida] Error al sugerir stock bajo:", error);
    return { ok: false, error: "No se pudieron agregar las sugerencias" };
  }
}
