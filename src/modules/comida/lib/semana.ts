import { diasHasta, fechaHoy, formatearFecha, sumarFecha } from "@/lib/format";

/**
 * El módulo trabaja con semanas que empiezan el lunes. La clave de una semana
 * es la fecha del lunes (`YYYY-MM-DD`), que viaja en la URL como `?semana=`.
 */
export const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const REGEX_FECHA_SEMANA = REGEX_FECHA;

/** Lunes de la semana a la que pertenece `fecha`. */
export function inicioSemana(fecha: string = fechaHoy()) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia));
  const diaSemana = fechaUtc.getUTCDay(); // 0 = domingo
  const retroceso = diaSemana === 0 ? 6 : diaSemana - 1;
  return new Date(
    Date.UTC(anio, mes - 1, dia - retroceso),
  )
    .toISOString()
    .slice(0, 10);
}

/** Los siete días de la semana que arranca en `inicio`. */
export function diasDeSemana(inicio: string) {
  return Array.from({ length: 7 }, (_, indice) =>
    sumarFecha(inicio, "dia", indice),
  );
}

/** Valida el parámetro `semana`; si no es una fecha, usa la semana actual. */
export function semanaComida(valor: string | undefined) {
  if (!valor || !REGEX_FECHA_SEMANA.test(valor)) return inicioSemana();
  return inicioSemana(valor);
}

/** "2026-11-02" -> "lun 2" */
export function etiquetaDiaCorto(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(anio, mes - 1, dia)))
    .replace(".", "");
}

/** "2026-11-02" -> "lunes 2 de noviembre" */
export function etiquetaDiaLargo(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)));
}

/** "2026-11-02" -> "2 nov" */
export function etiquetaDiaNumero(fecha: string) {
  return formatearFecha(fecha, false);
}

/** "lun 2 – dom 8 de noviembre" para el encabezado del menú. */
export function rangoSemana(inicio: string) {
  const fin = sumarFecha(inicio, "dia", 6);
  return `${etiquetaDiaCorto(inicio)} – ${etiquetaDiaCorto(fin)} ${formatearFecha(
    fin,
    false,
  )
    .split(" ")
    .slice(-1)}`;
}

/** "Esta semana", "Próxima semana", "Semana del 2 nov". */
export function tituloSemana(inicio: string, hoy: string = fechaHoy()) {
  const diferencia = diasHasta(inicio, inicioSemana(hoy));
  if (diferencia === 0) return "Esta semana";
  if (diferencia === 7) return "Próxima semana";
  if (diferencia === -7) return "Semana pasada";
  return `Semana del ${etiquetaDiaNumero(inicio)}`;
}

export function esHoy(fecha: string, hoy: string = fechaHoy()) {
  return fecha === hoy;
}

export function esFinde(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return diaSemana === 0 || diaSemana === 6;
}
