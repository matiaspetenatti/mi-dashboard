import { sumarFecha } from "@/lib/format";

/**
 * Utilidades de tiempo de estudio: rachas, heatmap y formato de duración.
 * Funciones puras (sin "server-only") para poder usarlas en queries y componentes cliente.
 */

/** Suma `n` días a una fecha "YYYY-MM-DD". */
export function sumarDias(fecha: string, n: number) {
  return sumarFecha(fecha, "dia", n);
}

/** Lunes de la semana a la que pertenece `fecha`. */
export function inicioSemana(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  return sumarDias(fecha, -offset);
}

/** Últimos 365 días como arreglo de fechas "YYYY-MM-DD", de la más vieja a la más reciente. */
export function obtenerUltimoAnioDias(hoy: string): string[] {
  const dias: string[] = [];
  for (let i = 364; i >= 0; i--) {
    dias.push(sumarDias(hoy, -i));
  }
  return dias;
}

/** Agrupa fechas consecutivas en semanas (lunes a domingo). Cada semana es un arreglo de 7 celdas (fecha o null). */
export function agruparPorSemanas(fechas: string[]): Array<Array<string | null>> {
  if (fechas.length === 0) return [];

  const presentes = new Set(fechas);
  const inicio = inicioSemana(fechas[0]);
  const fin = fechas[fechas.length - 1];

  const semanas: Array<Array<string | null>> = [];
  let semana: Array<string | null> = [];
  let cursor = inicio;

  while (cursor <= fin) {
    semana.push(presentes.has(cursor) ? cursor : null);
    if (semana.length === 7) {
      semanas.push(semana);
      semana = [];
    }
    cursor = sumarDias(cursor, 1);
  }

  if (semana.length > 0) {
    while (semana.length < 7) semana.push(null);
    semanas.push(semana);
  }

  return semanas;
}

/** Nivel de intensidad (0 a 4) según los minutos estudiados en un día. */
export function nivelMinutos(minutos: number) {
  if (minutos <= 0) return 0;
  if (minutos < 30) return 1;
  if (minutos < 60) return 2;
  if (minutos < 120) return 3;
  return 4;
}

/** "125" -> "2h 5m"; "45" -> "45m". */
export function formatearMinutos(minutos: number) {
  if (minutos <= 0) return "0m";
  if (minutos < 60) return `${minutos}m`;
  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;
  return restante === 0 ? `${horas}h` : `${horas}h ${restante}m`;
}

/**
 * Racha de días consecutivos con actividad, terminando en `hoy`.
 * Si hoy todavía no registró actividad, la racha sigue viva desde ayer.
 */
export function calcularRachaActividad(fechas: Set<string>, hoy: string) {
  let racha = 0;
  let cursor = fechas.has(hoy) ? hoy : sumarDias(hoy, -1);

  while (fechas.has(cursor)) {
    racha += 1;
    cursor = sumarDias(cursor, -1);
  }
  return racha;
}

/** Racha máxima histórica de días consecutivos con actividad. */
export function calcularRachaMaxima(fechas: Set<string>) {
  const dias = [...fechas].sort();
  let actual = 0;
  let maxima = 0;
  let anterior: string | null = null;

  for (const dia of dias) {
    actual = anterior && sumarDias(anterior, 1) === dia ? actual + 1 : 1;
    if (actual > maxima) maxima = actual;
    anterior = dia;
  }
  return maxima;
}
