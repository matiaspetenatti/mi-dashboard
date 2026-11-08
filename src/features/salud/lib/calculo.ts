import { formatearFecha } from "@/lib/format"
import {
  DIAS_ANALISIS,
  DIAS_SERIE,
  FACTORES_POR_SLUG,
} from "../constantes"
import type {
  CorrelacionHabitos,
  EpisodioConFactores,
  FilaMapa,
  MetricaCorrelacion,
  PuntoSerie,
  ResumenSalud,
  ResumenSaludWidget,
} from "../types"
import { mesAnterior, minutosEntre, sumarDias } from "./fechas"
import type { RegistroDiarioSalud } from "@/server/db/schema"

function promedio(valores: number[]) {
  if (valores.length === 0) return null
  return (
    Math.round(
      (valores.reduce((total, valor) => total + valor, 0) / valores.length) *
        10,
    ) / 10
  )
}

function contarRachaLibre(hoy: string, fechasConEpisodio: Set<string>) {
  let racha = 0
  while (racha < 730 && !fechasConEpisodio.has(sumarDias(hoy, -racha))) {
    racha += 1
  }
  return racha
}

type IndicadoresSalud = Omit<
  ResumenSaludWidget,
  "totalEpisodios" | "totalConAura"
> & {
  totalEpisodios: number
  totalConAura: number
}

function calcularIndicadores(
  hoy: string,
  episodios: EpisodioConFactores[],
): IndicadoresSalud {
  const mes = hoy.slice(0, 7)
  const mesPrevio = mesAnterior(mes)
  const desdeAnalisis = sumarDias(hoy, -(DIAS_ANALISIS - 1))

  const delMes = episodios.filter((episodio) =>
    episodio.inicioEn.startsWith(mes),
  )
  const delMesAnterior = episodios.filter((episodio) =>
    episodio.inicioEn.startsWith(mesPrevio),
  )

  const diasTranscurridos = Number(hoy.slice(8, 10))
  const diasConEpisodioMes = new Set(
    delMes.map((episodio) => episodio.inicioEn.slice(0, 10)),
  )
  const fechasConEpisodio = new Set(
    episodios.map((episodio) => episodio.inicioEn.slice(0, 10)),
  )

  const duracionesMes = delMes
    .map((episodio) =>
      episodio.finEn
        ? minutosEntre(episodio.inicioEn, episodio.finEn)
        : null,
    )
    .filter((valor): valor is number => valor !== null && valor > 0)

  const analisis = episodios.filter((episodio) => {
    const fecha = episodio.inicioEn.slice(0, 10)
    return fecha >= desdeAnalisis && fecha <= hoy
  })

  const conTetralgin = analisis.filter(
    (episodio) => episodio.tomoTetralgin && episodio.alivio !== null,
  )
  const conAlivio = conTetralgin.filter(
    (episodio) =>
      episodio.alivio === "completo" || episodio.alivio === "parcial",
  )

  return {
    diasTranscurridos,
    diasLibres: Math.max(0, diasTranscurridos - diasConEpisodioMes.size),
    rachaLibre:
      episodios.length > 0
        ? contarRachaLibre(hoy, fechasConEpisodio)
        : null,
    episodiosMes: delMes.length,
    episodiosMesAnterior: delMesAnterior.length,
    evaPromedio: promedio(delMes.map((episodio) => episodio.intensidad)),
    duracionPromedioMin: promedio(duracionesMes),
    efectividadTetralgin:
      conTetralgin.length > 0
        ? Math.round((conAlivio.length / conTetralgin.length) * 100)
        : null,
    episodiosConTetralgin: conTetralgin.length,
    episodiosConAlivio: conAlivio.length,
    totalEpisodios: episodios.length,
    totalConAura: episodios.filter((episodio) => episodio.aura).length,
  }
}

function calcularSerie(
  hoy: string,
  episodios: EpisodioConFactores[],
): PuntoSerie[] {
  const desdeSerie = sumarDias(hoy, -(DIAS_SERIE - 1))
  const acumuladoPorFecha = new Map<
    string,
    { eva: number; minutos: number; episodios: number }
  >()

  for (const episodio of episodios) {
    const fecha = episodio.inicioEn.slice(0, 10)
    if (fecha < desdeSerie || fecha > hoy) continue

    const acumulado = acumuladoPorFecha.get(fecha) ?? {
      eva: 0,
      minutos: 0,
      episodios: 0,
    }

    acumulado.eva = Math.max(acumulado.eva, episodio.intensidad)
    acumulado.episodios += 1

    if (episodio.finEn) {
      const minutos = minutosEntre(episodio.inicioEn, episodio.finEn)
      if (minutos !== null && minutos > 0) acumulado.minutos += minutos
    }

    acumuladoPorFecha.set(fecha, acumulado)
  }

  const serie: PuntoSerie[] = []
  for (let indice = DIAS_SERIE - 1; indice >= 0; indice -= 1) {
    const fecha = sumarDias(hoy, -indice)
    const acumulado = acumuladoPorFecha.get(fecha)
    serie.push({
      fecha,
      etiqueta: formatearFecha(fecha, false),
      eva: acumulado?.eva ?? null,
      duracionHoras: acumulado
        ? Math.round((acumulado.minutos / 60) * 10) / 10
        : 0,
      episodios: acumulado?.episodios ?? 0,
    })
  }

  return serie
}

function calcularMapa(
  hoy: string,
  episodios: EpisodioConFactores[],
): FilaMapa[] {
  const desdeAnalisis = sumarDias(hoy, -(DIAS_ANALISIS - 1))
  const analisis = episodios.filter((episodio) => {
    const fecha = episodio.inicioEn.slice(0, 10)
    return fecha >= desdeAnalisis && fecha <= hoy
  })

  const conteo = new Map<string, number>()
  for (const episodio of analisis) {
    for (const factor of episodio.factores) {
      conteo.set(factor, (conteo.get(factor) ?? 0) + 1)
    }
  }

  return [...conteo.entries()]
    .map(([factor, cantidad]) => {
      const info = FACTORES_POR_SLUG.get(factor)
      return {
        factor,
        etiqueta: info?.label ?? factor,
        categoria: info?.categoria ?? "otro",
        episodios: cantidad,
        porcentaje:
          analisis.length > 0
            ? Math.round((cantidad / analisis.length) * 100)
            : 0,
      }
    })
    .sort(
      (a, b) =>
        b.episodios - a.episodios ||
        a.etiqueta.localeCompare(b.etiqueta, "es"),
    )
    .slice(0, 7)
}

const METRICAS_HABITOS: Array<{
  clave: keyof Pick<
    RegistroDiarioSalud,
    | "horasSueno"
    | "nivelEstres"
    | "horasPantalla"
    | "tazasCafeina"
    | "vasosAgua"
  >
  etiqueta: string
  unidad: string
}> = [
  { clave: "horasSueno", etiqueta: "Sueño", unidad: "h" },
  { clave: "nivelEstres", etiqueta: "Estrés", unidad: "/5" },
  { clave: "horasPantalla", etiqueta: "Pantallas", unidad: "h" },
  { clave: "tazasCafeina", etiqueta: "Cafeína", unidad: "tazas" },
  { clave: "vasosAgua", etiqueta: "Agua", unidad: "vasos" },
]

function calcularCorrelacion(
  hoy: string,
  episodios: EpisodioConFactores[],
  diario: RegistroDiarioSalud[],
): CorrelacionHabitos | null {
  const desdeAnalisis = sumarDias(hoy, -(DIAS_ANALISIS - 1))
  const registros = diario.filter((registro) => registro.fecha >= desdeAnalisis)
  const fechasConCrisis = new Set(
    episodios.map((episodio) => episodio.inicioEn.slice(0, 10)),
  )

  const conCrisis = registros.filter((registro) =>
    fechasConCrisis.has(registro.fecha),
  )
  const sinCrisis = registros.filter(
    (registro) => !fechasConCrisis.has(registro.fecha),
  )

  if (
    registros.length < 7 ||
    conCrisis.length < 2 ||
    sinCrisis.length < 2
  ) {
    return null
  }

  const metricas: MetricaCorrelacion[] = METRICAS_HABITOS.map((metrica) => ({
    clave: String(metrica.clave),
    etiqueta: metrica.etiqueta,
    unidad: metrica.unidad,
    conCrisis: promedio(
      conCrisis
        .map((registro) => registro[metrica.clave])
        .filter((valor): valor is number => typeof valor === "number"),
    ),
    sinCrisis: promedio(
      sinCrisis
        .map((registro) => registro[metrica.clave])
        .filter((valor): valor is number => typeof valor === "number"),
    ),
  })).filter(
    (metrica) => metrica.conCrisis !== null && metrica.sinCrisis !== null,
  )

  return {
    registros: registros.length,
    registrosConCrisis: conCrisis.length,
    registrosSinCrisis: sinCrisis.length,
    metricas,
  }
}

export function calcularResumenSalud({
  hoy,
  episodios,
  diario,
}: {
  hoy: string
  episodios: EpisodioConFactores[]
  diario: RegistroDiarioSalud[]
}): ResumenSalud {
  return {
    ...calcularIndicadores(hoy, episodios),
    serie: calcularSerie(hoy, episodios),
    mapa: calcularMapa(hoy, episodios),
    correlacion: calcularCorrelacion(hoy, episodios, diario),
  }
}

export function calcularResumenWidget(
  hoy: string,
  episodios: EpisodioConFactores[],
): ResumenSaludWidget {
  return calcularIndicadores(hoy, episodios)
}
