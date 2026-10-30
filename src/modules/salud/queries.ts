import "server-only";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { fechaHoy, mesAnterior } from "@/lib/format";
import {
  DIAS_ANALISIS,
  DIAS_SERIE,
  FACTORES_POR_SLUG,
  SALUD_TAG,
  nivelDolor,
} from "./constantes";
import { formatearDiaCorto, minutosEntre, sumarDias } from "./lib/fechas";
import {
  saludEpisodios,
  saludEpisodioDesencadenantes,
  saludRegistrosDiarios,
  type EpisodioSalud,
  type RegistroDiarioSalud,
} from "./schema";

export type EpisodioConFactores = EpisodioSalud & {
  factores: string[];
};

export type PuntoSerie = {
  fecha: string;
  etiqueta: string;
  eva: number | null;
  duracionHoras: number;
  episodios: number;
};

export type FilaMapa = {
  factor: string;
  etiqueta: string;
  categoria: string;
  episodios: number;
  porcentaje: number;
};

export type MetricaCorrelacion = {
  clave: string;
  etiqueta: string;
  unidad: string;
  conCrisis: number | null;
  sinCrisis: number | null;
};

export type CorrelacionHabitos = {
  registros: number;
  registrosConCrisis: number;
  registrosSinCrisis: number;
  metricas: MetricaCorrelacion[];
};

export type ResumenSalud = {
  hoy: string;
  mes: string;
  diasTranscurridos: number;
  diasLibres: number;
  rachaLibre: number | null;
  episodiosMes: number;
  episodiosMesAnterior: number;
  evaPromedio: number | null;
  duracionPromedioMin: number | null;
  efectividadTetralgin: number | null;
  episodiosConTetralgin: number;
  episodiosConAlivio: number;
  totalEpisodios: number;
  totalConAura: number;
  serie: PuntoSerie[];
  mapa: FilaMapa[];
  episodios: EpisodioConFactores[];
  diario: RegistroDiarioSalud[];
  correlacion: CorrelacionHabitos | null;
};

function promedio(valores: number[]) {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

function contarRachaLibre(
  hoy: string,
  fechasConEpisodio: Set<string>,
) {
  let racha = 0;
  // Cortamos a los 2 años para evitar loops si hubiera datos raros.
  while (racha < 730 && !fechasConEpisodio.has(sumarDias(hoy, -racha))) {
    racha += 1;
  }
  return racha;
}

async function leerSalud(): Promise<ResumenSalud> {
  const hoy = fechaHoy();
  const mes = hoy.slice(0, 7);
  const desdeSerie = sumarDias(hoy, -(DIAS_SERIE - 1));
  const desdeAnalisis = sumarDias(hoy, -(DIAS_ANALISIS - 1));

  const [filasEpisodios, filasFactores, filasDiario] = await Promise.all([
    db
      .select()
      .from(saludEpisodios)
      .orderBy(desc(saludEpisodios.inicioEn))
      .limit(500),
    db.select().from(saludEpisodioDesencadenantes),
    db
      .select()
      .from(saludRegistrosDiarios)
      .where(gte(saludRegistrosDiarios.fecha, desdeAnalisis))
      .orderBy(desc(saludRegistrosDiarios.fecha)),
  ]);

  const factoresPorEpisodio = new Map<number, string[]>();
  for (const fila of filasFactores) {
    const lista = factoresPorEpisodio.get(fila.episodioId) ?? [];
    lista.push(fila.factor);
    factoresPorEpisodio.set(fila.episodioId, lista);
  }

  const episodios: EpisodioConFactores[] = filasEpisodios.map((episodio) => ({
    ...episodio,
    factores: factoresPorEpisodio.get(episodio.id) ?? [],
  }));

  const delMes = episodios.filter((e) => e.inicioEn.startsWith(mes));
  const delMesAnterior = episodios.filter((e) =>
    e.inicioEn.startsWith(mesAnterior(mes)),
  );

  const diasTranscurridos = Number(hoy.slice(8, 10));
  const diasConEpisodio = new Set(
    delMes.map((e) => e.inicioEn.slice(0, 10)),
  );
  const diasLibres = Math.max(0, diasTranscurridos - diasConEpisodio.size);

  const fechasConEpisodio = new Set(
    episodios.map((e) => e.inicioEn.slice(0, 10)),
  );

  const duracionesMes = delMes
    .map((e) => (e.finEn ? minutosEntre(e.inicioEn, e.finEn) : null))
    .filter((valor): valor is number => valor !== null && valor > 0);

  const analisis = episodios.filter((e) => {
    const fecha = e.inicioEn.slice(0, 10);
    return fecha >= desdeAnalisis && fecha <= hoy;
  });

  const conTetralgin = analisis.filter(
    (e) => e.tomoTetralgin && e.alivio !== null,
  );
  const conAlivio = conTetralgin.filter(
    (e) => e.alivio === "completo" || e.alivio === "parcial",
  );

  // Serie diaria para el gráfico: EVA máxima y horas de crisis por día.
  const acumuladoPorFecha = new Map<
    string,
    { eva: number; minutos: number; episodios: number }
  >();

  for (const episodio of episodios) {
    const fecha = episodio.inicioEn.slice(0, 10);
    if (fecha < desdeSerie || fecha > hoy) continue;

    const acumulado = acumuladoPorFecha.get(fecha) ?? {
      eva: 0,
      minutos: 0,
      episodios: 0,
    };

    acumulado.eva = Math.max(acumulado.eva, episodio.intensidad);
    acumulado.episodios += 1;
    if (episodio.finEn) {
      const minutos = minutosEntre(episodio.inicioEn, episodio.finEn);
      if (minutos !== null && minutos > 0) acumulado.minutos += minutos;
    }

    acumuladoPorFecha.set(fecha, acumulado);
  }

  const serie: PuntoSerie[] = [];
  for (let i = DIAS_SERIE - 1; i >= 0; i -= 1) {
    const fecha = sumarDias(hoy, -i);
    const acumulado = acumuladoPorFecha.get(fecha);
    serie.push({
      fecha,
      etiqueta: formatearDiaCorto(fecha),
      eva: acumulado?.eva ?? null,
      duracionHoras: acumulado
        ? Math.round((acumulado.minutos / 60) * 10) / 10
        : 0,
      episodios: acumulado?.episodios ?? 0,
    });
  }

  const conteoPorFactor = new Map<string, number>();
  for (const episodio of analisis) {
    for (const factor of episodio.factores) {
      conteoPorFactor.set(factor, (conteoPorFactor.get(factor) ?? 0) + 1);
    }
  }

  const mapa: FilaMapa[] = [...conteoPorFactor.entries()]
    .map(([factor, cantidad]) => {
      const info = FACTORES_POR_SLUG.get(factor);
      return {
        factor,
        etiqueta: info?.label ?? factor,
        categoria: info?.categoria ?? "otro",
        episodios: cantidad,
        porcentaje:
          analisis.length > 0
            ? Math.round((cantidad / analisis.length) * 100)
            : 0,
      };
    })
    .sort(
      (a, b) =>
        b.episodios - a.episodios ||
        a.etiqueta.localeCompare(b.etiqueta, "es"),
    )
    .slice(0, 7);

  const evaPromedio = promedio(delMes.map((e) => e.intensidad));

  const registrosConCrisis = filasDiario.filter((registro) =>
    fechasConEpisodio.has(registro.fecha),
  );
  const registrosSinCrisis = filasDiario.filter(
    (registro) => !fechasConEpisodio.has(registro.fecha),
  );

  const metricasBase: Array<{
    clave: keyof RegistroDiarioSalud;
    etiqueta: string;
    unidad: string;
  }> = [
    { clave: "horasSueno", etiqueta: "Sueño", unidad: "h" },
    { clave: "nivelEstres", etiqueta: "Estrés", unidad: "/5" },
    { clave: "horasPantalla", etiqueta: "Pantallas", unidad: "h" },
    { clave: "tazasCafeina", etiqueta: "Cafeína", unidad: "tazas" },
    { clave: "vasosAgua", etiqueta: "Agua", unidad: "vasos" },
  ];

  const correlacion: CorrelacionHabitos | null =
    filasDiario.length >= 7 &&
    registrosConCrisis.length >= 2 &&
    registrosSinCrisis.length >= 2
      ? {
          registros: filasDiario.length,
          registrosConCrisis: registrosConCrisis.length,
          registrosSinCrisis: registrosSinCrisis.length,
          metricas: metricasBase
            .map((metrica) => ({
              clave: String(metrica.clave),
              etiqueta: metrica.etiqueta,
              unidad: metrica.unidad,
              conCrisis: promedio(
                registrosConCrisis
                  .map((registro) => registro[metrica.clave])
                  .filter((valor): valor is number => typeof valor === "number"),
              ),
              sinCrisis: promedio(
                registrosSinCrisis
                  .map((registro) => registro[metrica.clave])
                  .filter((valor): valor is number => typeof valor === "number"),
              ),
            }))
            .filter(
              (metrica) =>
                metrica.conCrisis !== null && metrica.sinCrisis !== null,
            ),
        }
      : null;

  return {
    hoy,
    mes,
    diasTranscurridos,
    diasLibres,
    rachaLibre:
      episodios.length > 0 ? contarRachaLibre(hoy, fechasConEpisodio) : null,
    episodiosMes: delMes.length,
    episodiosMesAnterior: delMesAnterior.length,
    evaPromedio,
    duracionPromedioMin: promedio(duracionesMes),
    efectividadTetralgin:
      conTetralgin.length > 0
        ? Math.round((conAlivio.length / conTetralgin.length) * 100)
        : null,
    episodiosConTetralgin: conTetralgin.length,
    episodiosConAlivio: conAlivio.length,
    totalEpisodios: episodios.length,
    totalConAura: episodios.filter((e) => e.aura).length,
    serie,
    mapa,
    episodios,
    diario: filasDiario,
    correlacion,
  };
}

const getSaludCache = cache(async () => {
  "use cache";
  cacheLife("minutes");
  cacheTag(SALUD_TAG);

  return leerSalud();
});

export async function getSalud() {
  return getSaludCache();
}

/** Etiqueta de severidad lista para pintar en la UI. */
export function severidadEpisodio(intensidad: number) {
  return nivelDolor(intensidad);
}
