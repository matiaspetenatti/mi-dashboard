import { format } from "date-fns";

/**
 * Calcula la racha actual de un hábito (días consecutivos hasta hoy).
 * Para hábitos buenos: racha de días completados.
 * Para hábitos malos: racha de días sin recaída (completado = true significa "día limpio").
 */
export function calcularRachaActual(
  registros: Array<{ fecha: string; completado: boolean }>,
  hoy: string = new Date().toISOString().slice(0, 10),
): number {
  const ordenados = [...registros].sort(
    (a, b) => b.fecha.localeCompare(a.fecha),
  );

  let racha = 0;
  let fechaActual = hoy;

  for (const registro of ordenados) {
    if (registro.fecha > fechaActual) continue;
    if (registro.fecha < fechaActual) break;

    if (registro.completado) {
      racha += 1;
      const anterior = new Date(fechaActual);
      anterior.setDate(anterior.getDate() - 1);
      fechaActual = anterior.toISOString().slice(0, 10);
    } else {
      // Día faltante rompe la racha
      break;
    }
  }

  return racha;
}

/**
 * Calcula la racha máxima histórica de un hábito.
 */
export function calcularRachaMaxima(
  registros: Array<{ fecha: string; completado: boolean }>,
): number {
  const ordenados = [...registros].sort((a, b) =>
    a.fecha.localeCompare(b.fecha),
  );

  let rachaActual = 0;
  let rachaMaxima = 0;

  for (const registro of ordenados) {
    if (registro.completado) {
      rachaActual += 1;
      if (rachaActual > rachaMaxima) {
        rachaMaxima = rachaActual;
      }
    } else {
      rachaActual = 0;
    }
  }

  return rachaMaxima;
}

/**
 * Genera los datos para el heatmap de un hábito durante el último año.
 * Devuelve un mapa de fecha -> boolean (completado o no).
 * Faltan días se consideran como "no completado".
 */
export function generarHeatmapData(
  registros: Array<{ fecha: string; completado: boolean }>,
): Map<string, boolean> {
  const mapa = new Map<string, boolean>();

  for (const r of registros) {
    mapa.set(r.fecha, r.completado);
  }

  return mapa;
}

/**
 * Obtiene los últimos 365 días como arreglo de fechas "YYYY-MM-DD".
 */
export function obtenerUltimoAnioDias(): string[] {
  const dias: string[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = 364; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    dias.push(d.toISOString().slice(0, 10));
  }

  return dias;
}

/**
 * Agrupa fechas por semana para el layout de heatmap (semana = fila, día de la semana = columna).
 * Devuelve un array de semanas, cada una con 7 celdas (fecha o null para días fuera del rango).
 */
export function agruparPorSemanas(fechas: string[]): Array<Array<string | null>> {
  if (!fechas.length) return [];

  const semanas: Array<Array<string | null>> = [];
  let semanaActual: Array<string | null> = [];

  const empezarLunes = (fecha: string) => {
    const d = new Date(fecha + "T00:00:00");
    const dia = d.getDay(); // 0 = dom, 1 = lun, ...
    const offset = dia === 0 ? 6 : dia - 1;
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0, 10);
  };

  let lunesSemana = "";
  let primera = true;

  for (const fecha of fechas) {
    const d = new Date(fecha + "T00:00:00");
    const lunes = empezarLunes(fecha);

    if (primera) {
      lunesSemana = lunes;
      primera = false;
    }

    if (lunes !== lunesSemana) {
      // Rellenar la semana anterior hasta 7 días
      while (semanaActual.length < 7) {
        const ultimo = semanaActual[semanaActual.length - 1];
        const sig = ultimo
          ? new Date(ultimo + "T00:00:00")
          : new Date(lunesSemana + "T00:00:00");
        sig.setDate(sig.getDate() + 1);
        semanaActual.push(sig.toISOString().slice(0, 10));
      }
      semanas.push(semanaActual);
      semanaActual = [];
      lunesSemana = lunes;
    }

    semanaActual.push(fecha);
  }

  // Última semana
  while (semanaActual.length < 7) {
    const ultimo = semanaActual[semanaActual.length - 1];
    const sig = ultimo
      ? new Date(ultimo + "T00:00:00")
      : new Date(lunesSemana + "T00:00:00");
    sig.setDate(sig.getDate() + 1);
    semanaActual.push(sig.toISOString().slice(0, 10));
  }
  if (semanaActual.length > 0) {
    semanas.push(semanaActual);
  }

  return semanas;
}

/**
 * Nivel de intensidad para el color de una celda del heatmap (0 a 4).
 * Para hábitos buenos: 1 = completado.
 * Para hábitos malos: 1 = día limpio (completado = true).
 */
export function nivelIntensidad(completado: boolean): number {
  return completado ? 1 : 0;
}
