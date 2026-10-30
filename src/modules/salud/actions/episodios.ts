"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import {
  MAX_COMPRIMIDOS_TETRALGIN,
  SLUGS_AURA,
  SLUGS_FACTORES,
  SLUGS_SINTOMAS,
} from "../constantes";
import { compararFechaHora, REGEX_FECHA_HORA } from "../lib/fechas";
import { invalidarSalud } from "../lib/invalidar";
import {
  saludEpisodios,
  saludEpisodioDesencadenantes,
} from "../schema";

export type ResultadoAccion =
  | { ok: true }
  | { ok: false; error: string };

function texto(formData: FormData, clave: string) {
  const valor = formData.get(clave);
  return typeof valor === "string" ? valor.trim() : "";
}

function opcional(formData: FormData, clave: string) {
  const valor = texto(formData, clave);
  return valor === "" ? null : valor;
}

function numero(formData: FormData, clave: string) {
  const valor = texto(formData, clave).replace(",", ".");
  if (valor === "") return null;
  const parsed = Number(valor);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function listaValida(formData: FormData, clave: string, permitidos: Set<string>) {
  const valores = formData
    .getAll(clave)
    .filter((valor): valor is string => typeof valor === "string")
    .filter((valor) => permitidos.has(valor));
  return [...new Set(valores)];
}

const episodioSchema = z
  .object({
    inicioEn: z.string().regex(REGEX_FECHA_HORA, "Fecha de inicio inválida"),
    finEn: z.string().regex(REGEX_FECHA_HORA, "Fecha de cierre inválida").nullable(),
    intensidad: z
      .number({ error: "Elegí la intensidad del dolor" })
      .int()
      .min(1, "La intensidad va de 1 a 10")
      .max(10, "La intensidad va de 1 a 10"),
    patron: z.enum(["pulsatil", "opresivo", "punzante"]).nullable(),
    lateralidad: z.enum(["izquierdo", "derecho", "bilateral"]).nullable(),
    aura: z.boolean(),
    auraTipos: z.array(z.string()),
    sintomas: z.array(z.string()),
    tomoTetralgin: z.boolean(),
    dosisTetralgin: z
      .number()
      .int()
      .min(1, "La dosis mínima es 1 comprimido")
      .max(
        MAX_COMPRIMIDOS_TETRALGIN,
        `La dosis máxima es ${MAX_COMPRIMIDOS_TETRALGIN} comprimidos`,
      )
      .nullable(),
    tetralginEn: z.string().regex(REGEX_FECHA_HORA).nullable(),
    alivio: z.enum(["completo", "parcial", "ninguno"]).nullable(),
    otroDesencadenante: z.string().max(200).nullable(),
    notas: z.string().max(2000, "Las notas son demasiado largas").nullable(),
    factores: z.array(z.string()),
  })
  .superRefine((datos, ctx) => {
    if (
      datos.finEn &&
      compararFechaHora(datos.finEn, datos.inicioEn) <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["finEn"],
        message: "La hora de cierre tiene que ser posterior al inicio",
      });
    }

    if (datos.tomoTetralgin && !datos.dosisTetralgin) {
      ctx.addIssue({
        code: "custom",
        path: ["dosisTetralgin"],
        message: "Indicá cuántos comprimidos de Tetralgin tomaste",
      });
    }

    if (datos.tomoTetralgin && datos.finEn && !datos.alivio) {
      ctx.addIssue({
        code: "custom",
        path: ["alivio"],
        message: "Indicá cómo respondió el Tetralgin",
      });
    }

    if (datos.factores.includes("otro") && !datos.otroDesencadenante) {
      ctx.addIssue({
        code: "custom",
        path: ["otroDesencadenante"],
        message: "Contanos cuál fue el desencadenante",
      });
    }
  });

function leerDatos(formData: FormData) {
  const otros = opcional(formData, "otroDesencadenante");
  const factores = listaValida(formData, "factores", SLUGS_FACTORES);

  return {
    inicioEn: texto(formData, "inicioEn"),
    finEn: opcional(formData, "finEn"),
    intensidad: numero(formData, "intensidad"),
    patron: opcional(formData, "patron"),
    lateralidad: opcional(formData, "lateralidad"),
    aura: texto(formData, "aura") === "true",
    auraTipos: listaValida(formData, "auraTipos", SLUGS_AURA),
    sintomas: listaValida(formData, "sintomas", SLUGS_SINTOMAS),
    tomoTetralgin: texto(formData, "tomoTetralgin") === "true",
    dosisTetralgin: numero(formData, "dosisTetralgin"),
    tetralginEn: opcional(formData, "tetralginEn"),
    alivio: opcional(formData, "alivio"),
    otroDesencadenante: otros,
    notas: opcional(formData, "notas"),
    factores,
  };
}

function validar(formData: FormData) {
  const parsed = episodioSchema.safeParse(leerDatos(formData));
  if (!parsed.success) {
    const mensaje = parsed.error.issues[0]?.message;
    return {
      ok: false as const,
      error:
        typeof mensaje === "string" && mensaje.length > 0
          ? mensaje
          : "Datos inválidos",
    };
  }

  const { factores, ...datos } = parsed.data;
  return { ok: true as const, datos, factores };
}

function idValido(valor: number) {
  return Number.isInteger(valor) && valor > 0;
}

export async function crearEpisodio(
  formData: FormData,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const resultado = validar(formData);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  const { datos, factores } = resultado;

  try {
    await db.transaction(async (tx) => {
      const [creado] = await tx
        .insert(saludEpisodios)
        .values({ ...datos, creadoEn: new Date().toISOString() })
        .returning({ id: saludEpisodios.id });

      if (factores.length > 0) {
        await tx.insert(saludEpisodioDesencadenantes).values(
          factores.map((factor) => ({ episodioId: creado.id, factor })),
        );
      }
    });

    invalidarSalud();
    return { ok: true };
  } catch (error) {
    console.error("[salud] Error al crear episodio:", error);
    return { ok: false, error: "No se pudo guardar el episodio" };
  }
}

export async function actualizarEpisodio(
  id: number,
  formData: FormData,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Episodio inválido" };

  const resultado = validar(formData);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  const { datos, factores } = resultado;

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(saludEpisodios)
        .set({ ...datos, actualizadoEn: new Date().toISOString() })
        .where(eq(saludEpisodios.id, id));

      await tx
        .delete(saludEpisodioDesencadenantes)
        .where(eq(saludEpisodioDesencadenantes.episodioId, id));

      if (factores.length > 0) {
        await tx.insert(saludEpisodioDesencadenantes).values(
          factores.map((factor) => ({ episodioId: id, factor })),
        );
      }
    });

    invalidarSalud();
    return { ok: true };
  } catch (error) {
    console.error("[salud] Error al actualizar episodio:", error);
    return { ok: false, error: "No se pudo actualizar el episodio" };
  }
}

export async function cerrarEpisodio(
  id: number,
  finEn: string,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Episodio inválido" };
  if (!REGEX_FECHA_HORA.test(finEn)) {
    return { ok: false, error: "Fecha de cierre inválida" };
  }

  try {
    const [episodio] = await db
      .select({ inicioEn: saludEpisodios.inicioEn })
      .from(saludEpisodios)
      .where(eq(saludEpisodios.id, id))
      .limit(1);

    if (!episodio) return { ok: false, error: "El episodio no existe" };

    if (compararFechaHora(finEn, episodio.inicioEn) <= 0) {
      return { ok: false, error: "El cierre tiene que ser posterior al inicio" };
    }

    await db
      .update(saludEpisodios)
      .set({ finEn, actualizadoEn: new Date().toISOString() })
      .where(eq(saludEpisodios.id, id));

    invalidarSalud();
    return { ok: true };
  } catch (error) {
    console.error("[salud] Error al cerrar episodio:", error);
    return { ok: false, error: "No se pudo cerrar el episodio" };
  }
}

export async function eliminarEpisodio(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Episodio inválido" };

  try {
    await db.delete(saludEpisodios).where(eq(saludEpisodios.id, id));
    invalidarSalud();
    return { ok: true };
  } catch (error) {
    console.error("[salud] Error al eliminar episodio:", error);
    return { ok: false, error: "No se pudo eliminar el episodio" };
  }
}
