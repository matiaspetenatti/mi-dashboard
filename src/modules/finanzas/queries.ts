"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { cuentas, movimientos, type Cuenta, categoriasFinanzas } from "./schema";
import { and, asc, desc, eq, gte, inArray, isNull, like, lte, ne, sql } from "drizzle-orm";
import { fechaHoy, mesAnterior, nombreMes, sumarFecha } from "@/lib/format";
import { calcularRendimientoDiario } from "./rendimientos";
import {
  FINANZAS_CUENTAS_TAG,
  FINANZAS_EVOLUCION_TAG,
  FINANZAS_MOVIMIENTOS_TAG,
  FINANZAS_RESUMEN_TAG,
  FINANZAS_SERVICIOS_TAG,
  FINANZAS_TAG,
} from "./cache-tags";

export interface CuentaConSaldo extends Cuenta {
  saldo: number;
  estimadoDiario: number;
  estimadoMensual: number;
}

async function getFechaHoyCache(): Promise<string> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FINANZAS_TAG);

  return fechaHoy();
}

export async function getCategoriasFinanzas() {
  await requireAuthorizedUser();
  return db
    .select()
    .from(categoriasFinanzas)
    .where(eq(categoriasFinanzas.activo, true))
    .orderBy(asc(categoriasFinanzas.orden), asc(categoriasFinanzas.nombre));
}

/**
 * Devuelve el nombre de una categoría padre junto con los nombres de sus
 * subcategorías. Se usa para filtrar/agrupar movimientos que pueden estar
 * guardados con el nombre del padre o con el de cualquiera de sus hijos.
 */
async function obtenerNombresCategoriaConHijos(
  nombrePadre: string
): Promise<string[]> {
  const [padre] = await db
    .select({ id: categoriasFinanzas.id })
    .from(categoriasFinanzas)
    .where(
      and(
        eq(categoriasFinanzas.nombre, nombrePadre),
        isNull(categoriasFinanzas.parentId)
      )
    )
    .limit(1);

  if (!padre) return [nombrePadre];

  const hijos = await db
    .select({ nombre: categoriasFinanzas.nombre })
    .from(categoriasFinanzas)
    .where(eq(categoriasFinanzas.parentId, padre.id));

  return [nombrePadre, ...hijos.map((h) => h.nombre)];
}

async function leerCuentas(): Promise<CuentaConSaldo[]> {
  const [listaCuentas, totalesPorCuenta] = await Promise.all([
    db.select().from(cuentas).orderBy(cuentas.id),
    db
      .select({
        cuentaId: movimientos.cuentaId,
        ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
        gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
      })
      .from(movimientos)
      .groupBy(movimientos.cuentaId),
  ]);

  const saldosPorCuenta = new Map<number, { ingresos: number; gastos: number }>();
  for (const row of totalesPorCuenta) {
    if (row.cuentaId === null) continue;
    saldosPorCuenta.set(row.cuentaId, {
      ingresos: Number(row.ingresos ?? 0),
      gastos: Number(row.gastos ?? 0),
    });
  }

  return listaCuentas.map((cuenta) => {
    const totales = saldosPorCuenta.get(cuenta.id);
    const saldo = (totales?.ingresos ?? 0) - (totales?.gastos ?? 0);
    const estimadoDiario = calcularRendimientoDiario(saldo, cuenta.rendimientoAnual);

    return {
      ...cuenta,
      saldo,
      estimadoDiario,
      estimadoMensual: estimadoDiario * 30,
    };
  });
}

async function getCuentasCache(): Promise<CuentaConSaldo[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FINANZAS_TAG, FINANZAS_CUENTAS_TAG);

  return leerCuentas();
}

export async function getCuentas() {
  return getCuentasCache();
}

async function leerCuentaPorId(id: number): Promise<CuentaConSaldo | null> {
  const [cuenta] = await db.select().from(cuentas).where(eq(cuentas.id, id));
  if (!cuenta) return null;

  const [res] = await db
    .select({
      ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
      gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
    })
    .from(movimientos)
    .where(eq(movimientos.cuentaId, cuenta.id));

  const saldo = Number(res?.ingresos ?? 0) - Number(res?.gastos ?? 0);
  const estimadoDiario = calcularRendimientoDiario(saldo, cuenta.rendimientoAnual);

  return {
    ...cuenta,
    saldo,
    estimadoDiario,
    estimadoMensual: estimadoDiario * 30,
  };
}

async function getCuentaByIdCache(id: number): Promise<CuentaConSaldo | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FINANZAS_TAG, FINANZAS_CUENTAS_TAG);

  return leerCuentaPorId(id);
}

export async function getCuentaById(id: number) {
  return getCuentaByIdCache(id);
}

export interface MovimientoItem {
  id: number;
  cuentaId: number | null;
  tipo: "ingreso" | "gasto";
  monto: number;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  creadoEn: string;
  cuentaNombre: string | null;
  cuentaColor: string | null;
  cuentaTipo: string | null;
}

export interface MovimientosPaginadosResult {
  items: MovimientoItem[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

interface MovimientosPaginadosParams {
  pagina?: number;
  limite?: number;
  cuentaId?: number;
  tipo?: "ingreso" | "gasto" | "todos" | "rendimiento";
  categoria?: string;
  categoriaPadre?: string;
  ocultarRendimientos?: boolean;
}

async function leerMovimientosPaginados({
  pagina = 1,
  limite = 10,
  cuentaId,
  tipo,
  categoria,
  categoriaPadre,
  ocultarRendimientos = true,
}: MovimientosPaginadosParams = {}): Promise<MovimientosPaginadosResult> {
  const condiciones = [];

  if (cuentaId) {
    condiciones.push(eq(movimientos.cuentaId, cuentaId));
  }

  if (tipo === "ingreso") {
    condiciones.push(eq(movimientos.tipo, "ingreso"));
  } else if (tipo === "gasto") {
    condiciones.push(eq(movimientos.tipo, "gasto"));
  } else if (tipo === "rendimiento") {
    condiciones.push(eq(movimientos.categoria, "Rendimientos"));
  }

  if (categoria) {
    condiciones.push(eq(movimientos.categoria, categoria));
  } else if (categoriaPadre) {
    const nombres = await obtenerNombresCategoriaConHijos(categoriaPadre);
    condiciones.push(inArray(movimientos.categoria, nombres));
  }

  if (ocultarRendimientos && tipo !== "rendimiento") {
    condiciones.push(ne(movimientos.categoria, "Rendimientos"));
  }

  const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

  const [countRes] = await db
    .select({ total: sql<number>`count(*)` })
    .from(movimientos)
    .where(whereClause);

  const total = Number(countRes?.total ?? 0);
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const paginaSegura = Math.max(1, Math.min(pagina, totalPaginas));
  const offset = (paginaSegura - 1) * limite;

  const rows = await db
    .select({
      id: movimientos.id,
      cuentaId: movimientos.cuentaId,
      tipo: movimientos.tipo,
      monto: movimientos.monto,
      categoria: movimientos.categoria,
      descripcion: movimientos.descripcion,
      fecha: movimientos.fecha,
      creadoEn: movimientos.creadoEn,
      cuentaNombre: cuentas.nombre,
      cuentaColor: cuentas.color,
      cuentaTipo: cuentas.tipo,
    })
    .from(movimientos)
    .leftJoin(cuentas, eq(movimientos.cuentaId, cuentas.id))
    .where(whereClause)
    .orderBy(desc(movimientos.fecha), desc(movimientos.id))
    .limit(limite)
    .offset(offset);

  return {
    items: rows as MovimientoItem[],
    total,
    pagina: paginaSegura,
    limite,
    totalPaginas,
  };
}

async function getMovimientosPaginadosCache(
  params: MovimientosPaginadosParams
): Promise<MovimientosPaginadosResult> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FINANZAS_TAG, FINANZAS_MOVIMIENTOS_TAG);

  return leerMovimientosPaginados(params);
}

export async function getMovimientosPaginados(
  params: MovimientosPaginadosParams = {}
): Promise<MovimientosPaginadosResult> {
  await requireAuthorizedUser();
  const normalizados: MovimientosPaginadosParams = {
    pagina: params.pagina ?? 1,
    limite: params.limite ?? 10,
    cuentaId: params.cuentaId,
    tipo: params.tipo === "todos" ? undefined : params.tipo,
    categoria: params.categoria,
    categoriaPadre: params.categoriaPadre,
    ocultarRendimientos: params.ocultarRendimientos ?? true,
  };

  return getMovimientosPaginadosCache(normalizados);
}

async function leerMovimientosDelMes(
  mes: string,
  filtroCuentaId?: number
): Promise<MovimientoItem[]> {
  const whereClause = filtroCuentaId
    ? and(
        like(movimientos.fecha, `${mes}%`),
        eq(movimientos.cuentaId, filtroCuentaId)
      )
    : like(movimientos.fecha, `${mes}%`);

  const rows = await db
    .select({
      id: movimientos.id,
      cuentaId: movimientos.cuentaId,
      tipo: movimientos.tipo,
      monto: movimientos.monto,
      categoria: movimientos.categoria,
      descripcion: movimientos.descripcion,
      fecha: movimientos.fecha,
      creadoEn: movimientos.creadoEn,
      cuentaNombre: cuentas.nombre,
      cuentaColor: cuentas.color,
      cuentaTipo: cuentas.tipo,
    })
    .from(movimientos)
    .leftJoin(cuentas, eq(movimientos.cuentaId, cuentas.id))
    .where(whereClause)
    .orderBy(desc(movimientos.fecha), desc(movimientos.id));

  return rows as MovimientoItem[];
}

async function getMovimientosDelMesCache(
  mes: string,
  filtroCuentaId?: number
): Promise<MovimientoItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FINANZAS_TAG, FINANZAS_MOVIMIENTOS_TAG);

  return leerMovimientosDelMes(mes, filtroCuentaId);
}

export async function getMovimientosDelMes(filtroCuentaId?: number) {
  await requireAuthorizedUser();
  const hoy = await getFechaHoyCache();
  return getMovimientosDelMesCache(hoy.slice(0, 7), filtroCuentaId);
}

interface ResumenDelMes {
  ingresos: number;
  gastos: number;
  balance: number;
  rendimientos: number;
}

async function leerResumenDelMes(
  mes: string,
  filtroCuentaId?: number
): Promise<ResumenDelMes> {
  const whereClause = filtroCuentaId
    ? and(
        like(movimientos.fecha, `${mes}%`),
        eq(movimientos.cuentaId, filtroCuentaId)
      )
    : like(movimientos.fecha, `${mes}%`);

  const [row] = await db
    .select({
      ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
      gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
      rendimientos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' and ${movimientos.categoria} = 'Rendimientos' then ${movimientos.monto} end), 0)`,
    })
    .from(movimientos)
    .where(whereClause);

  const ingresos = Number(row?.ingresos ?? 0);
  const gastos = Number(row?.gastos ?? 0);
  const rendimientos = Number(row?.rendimientos ?? 0);

  return {
    ingresos,
    gastos,
    balance: ingresos - gastos,
    rendimientos,
  };
}

async function getResumenDelMesCache(
  mes: string,
  filtroCuentaId?: number
): Promise<ResumenDelMes> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FINANZAS_TAG, FINANZAS_RESUMEN_TAG);

  return leerResumenDelMes(mes, filtroCuentaId);
}

const getResumenDelMesRequest = cache(getResumenDelMesCache);

export async function getResumenDelMes(filtroCuentaId?: number) {
  await requireAuthorizedUser();
  const hoy = await getFechaHoyCache();
  return getResumenDelMesRequest(hoy.slice(0, 7), filtroCuentaId);
}

interface TotalesGlobales {
  saldoTotal: number;
  rendimientoDiarioTotal: number;
  rendimientoMensualTotal: number;
  rendimientosMes: number;
  cantidadCuentas: number;
}

async function getTotalesGlobalesCache(mes: string): Promise<TotalesGlobales> {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    FINANZAS_TAG,
    FINANZAS_CUENTAS_TAG,
    FINANZAS_RESUMEN_TAG
  );

  const [lista, { rendimientos }] = await Promise.all([
    getCuentas(),
    getResumenDelMesCache(mes),
  ]);

  const saldoTotal = lista.reduce((acc, c) => acc + c.saldo, 0);
  const rendimientoDiarioTotal = lista.reduce((acc, c) => acc + c.estimadoDiario, 0);
  const rendimientoMensualTotal = lista.reduce((acc, c) => acc + c.estimadoMensual, 0);

  return {
    saldoTotal,
    rendimientoDiarioTotal,
    rendimientoMensualTotal,
    rendimientosMes: rendimientos,
    cantidadCuentas: lista.length,
  };
}

const getTotalesGlobalesRequest = cache(getTotalesGlobalesCache);

export async function getTotalesGlobales() {
  await requireAuthorizedUser();
  const hoy = await getFechaHoyCache();
  return getTotalesGlobalesRequest(hoy.slice(0, 7));
}

export interface PuntoEvolucion {
  fecha: string;
  saldo: number; // en pesos
}

async function getEvolucionPatrimonioCache(hoy: string): Promise<PuntoEvolucion[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FINANZAS_TAG, FINANZAS_EVOLUCION_TAG);

  const fechaInicio = sumarFecha(hoy, "dia", -365);

  // 1. Saldo acumulado previo al periodo (antes de hace 365 días)
  const [saldoPrevioRow] = await db
    .select({
      neto: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} else -${movimientos.monto} end), 0)`,
    })
    .from(movimientos)
    .where(sql`${movimientos.fecha} < ${fechaInicio}`);

  let saldoCentavos = Number(saldoPrevioRow?.neto ?? 0);

  // 2. Movimientos agrupados por día dentro del periodo de 365 días
  const cambiosRows = await db
    .select({
      fecha: movimientos.fecha,
      neto: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} else -${movimientos.monto} end), 0)`,
    })
    .from(movimientos)
    .where(and(gte(movimientos.fecha, fechaInicio), lte(movimientos.fecha, hoy)))
    .groupBy(movimientos.fecha)
    .orderBy(movimientos.fecha);

  const cambiosPorDia = new Map<string, number>();
  for (const row of cambiosRows) {
    cambiosPorDia.set(row.fecha, Number(row.neto));
  }

  // 3. Generar la serie continua diaria
  const puntos: PuntoEvolucion[] = [];
  let fechaIter = fechaInicio;

  while (fechaIter <= hoy) {
    const cambio = cambiosPorDia.get(fechaIter) ?? 0;
    saldoCentavos += cambio;
    puntos.push({
      fecha: fechaIter,
      saldo: Math.round(saldoCentavos) / 100,
    });
    fechaIter = sumarFecha(fechaIter, "dia", 1);
  }

  return puntos;
}

const getEvolucionPatrimonioRequest = cache(getEvolucionPatrimonioCache);

export async function getEvolucionPatrimonio(): Promise<PuntoEvolucion[]> {
  await requireAuthorizedUser();
  return getEvolucionPatrimonioRequest(await getFechaHoyCache());
}

export interface ItemServicio {
  id: number;
  monto: number;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  cuentaNombre: string | null;
  cuentaColor: string | null;
}

export interface ServicioComparado {
  categoria: string;
  totalActual: number;
  totalAnterior: number;
  diferencia: number;
  porcentaje: number | null;
}

export interface ComparativaServiciosData {
  mesActual: string;
  mesActualNombre: string;
  totalActual: number;
  itemsActual: ItemServicio[];
  mesAnterior: string;
  mesAnteriorNombre: string;
  totalAnterior: number;
  itemsAnterior: ItemServicio[];
  diferencia: number;
  porcentaje: number;
  porServicio: ServicioComparado[];
}

async function getComparativaServiciosCache(
  mesAct: string,
  mesAnt: string
): Promise<ComparativaServiciosData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FINANZAS_TAG, FINANZAS_SERVICIOS_TAG);

  const nombresServicios = await obtenerNombresCategoriaConHijos("Servicios");

  const [serviciosMesActual, serviciosMesAnterior] = await Promise.all([
    db
      .select({
        id: movimientos.id,
        monto: movimientos.monto,
        categoria: movimientos.categoria,
        descripcion: movimientos.descripcion,
        fecha: movimientos.fecha,
        cuentaNombre: cuentas.nombre,
        cuentaColor: cuentas.color,
      })
      .from(movimientos)
      .leftJoin(cuentas, eq(movimientos.cuentaId, cuentas.id))
      .where(
        and(
          eq(movimientos.tipo, "gasto"),
          inArray(movimientos.categoria, nombresServicios),
          like(movimientos.fecha, `${mesAct}%`)
        )
      )
      .orderBy(desc(movimientos.fecha), desc(movimientos.id)),

    db
      .select({
        id: movimientos.id,
        monto: movimientos.monto,
        categoria: movimientos.categoria,
        descripcion: movimientos.descripcion,
        fecha: movimientos.fecha,
        cuentaNombre: cuentas.nombre,
        cuentaColor: cuentas.color,
      })
      .from(movimientos)
      .leftJoin(cuentas, eq(movimientos.cuentaId, cuentas.id))
      .where(
        and(
          eq(movimientos.tipo, "gasto"),
          inArray(movimientos.categoria, nombresServicios),
          like(movimientos.fecha, `${mesAnt}%`)
        )
      )
      .orderBy(desc(movimientos.fecha), desc(movimientos.id)),
  ]);

  const totalActual = serviciosMesActual.reduce((acc, m) => acc + m.monto, 0);
  const totalAnterior = serviciosMesAnterior.reduce((acc, m) => acc + m.monto, 0);
  const diferencia = totalActual - totalAnterior;

  let porcentaje = 0;
  if (totalAnterior > 0) {
    porcentaje = ((totalActual - totalAnterior) / totalAnterior) * 100;
  } else if (totalActual > 0) {
    porcentaje = 100;
  }

  // Agrupar por subcategoría para comparar cada servicio mes a mes.
  const grupos = new Map<string, { totalActual: number; totalAnterior: number }>();

  const etiquetaServicio = (categoria: string) =>
    categoria === "Servicios" ? "Servicios (general)" : categoria;

  for (const item of serviciosMesActual) {
    const key = etiquetaServicio(item.categoria);
    const grupo = grupos.get(key) ?? { totalActual: 0, totalAnterior: 0 };
    grupo.totalActual += item.monto;
    grupos.set(key, grupo);
  }

  for (const item of serviciosMesAnterior) {
    const key = etiquetaServicio(item.categoria);
    const grupo = grupos.get(key) ?? { totalActual: 0, totalAnterior: 0 };
    grupo.totalAnterior += item.monto;
    grupos.set(key, grupo);
  }

  const porServicio: ServicioComparado[] = [...grupos.entries()]
    .map(([categoria, grupo]) => {
      const diff = grupo.totalActual - grupo.totalAnterior;
      return {
        categoria,
        totalActual: grupo.totalActual,
        totalAnterior: grupo.totalAnterior,
        diferencia: diff,
        porcentaje:
          grupo.totalAnterior > 0
            ? Math.round((diff / grupo.totalAnterior) * 1000) / 10
            : null,
      };
    })
    .sort(
      (a, b) =>
        b.totalActual - a.totalActual || b.totalAnterior - a.totalAnterior
    );

  return {
    mesActual: mesAct,
    mesActualNombre: nombreMes(mesAct),
    totalActual,
    itemsActual: serviciosMesActual,
    mesAnterior: mesAnt,
    mesAnteriorNombre: nombreMes(mesAnt),
    totalAnterior,
    itemsAnterior: serviciosMesAnterior,
    diferencia,
    porcentaje: Math.round(porcentaje * 10) / 10,
    porServicio,
  };
}

const getComparativaServiciosRequest = cache(getComparativaServiciosCache);

export async function getComparativaServicios(): Promise<ComparativaServiciosData> {
  await requireAuthorizedUser();
  const hoy = await getFechaHoyCache();
  const mesAct = hoy.slice(0, 7);
  return getComparativaServiciosRequest(mesAct, mesAnterior(mesAct));
}
