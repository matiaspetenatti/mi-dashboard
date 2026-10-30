import "server-only";

import { and, asc, gte, inArray, lte } from "drizzle-orm";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { db } from "@/db";
import { formatearFecha } from "@/lib/format";
import {
  ALIVIOS_POR_VALOR,
  etiquetaAura,
  etiquetaFactor,
  etiquetaSintoma,
  LATERALIDADES_POR_VALOR,
  PATRONES_POR_VALOR,
} from "@/modules/salud/constantes";
import { minutosEntre } from "@/modules/salud/lib/fechas";
import {
  saludEpisodios,
  saludEpisodioDesencadenantes,
  type EpisodioSalud,
} from "@/modules/salud/schema";

const COLOR = {
  tinta: rgb(0.086, 0.2, 0),
  lima: rgb(0.624, 0.91, 0.439),
  carbon: rgb(0.271, 0.278, 0.271),
  gris: rgb(0.525, 0.525, 0.522),
  linea: rgb(0.89, 0.91, 0.88),
  fondo: rgb(0.965, 0.98, 0.957),
  blanco: rgb(1, 1, 1),
};

const A4: [number, number] = [595.28, 841.89];
const MARGEN = 48;
const ANCHO_UTIL = A4[0] - MARGEN * 2;

function limpiar(texto: string) {
  return texto
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7e\u00a0-\u00ff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function envolver(
  texto: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const palabras = limpiar(texto).split(" ").filter(Boolean);
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(prueba, size) <= maxWidth) {
      actual = prueba;
    } else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  }

  if (actual) lineas.push(actual);
  return lineas.length > 0 ? lineas : [""];
}

function promedio(valores: number[]) {
  if (valores.length === 0) return null;
  const total = valores.reduce((suma, valor) => suma + valor, 0);
  return Math.round((total / valores.length) * 10) / 10;
}

export function diasEntre(desde: string, hasta: string) {
  const a = Date.parse(`${desde}T00:00:00Z`);
  const b = Date.parse(`${hasta}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000) + 1;
}

function duracion(episodio: EpisodioSalud) {
  if (!episodio.finEn) return "en curso";
  const minutos = minutosEntre(episodio.inicioEn, episodio.finEn);
  if (minutos === null || minutos <= 0) return "-";

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

function horaDe(valor: string) {
  return valor.slice(11, 16);
}

type EpisodioInforme = EpisodioSalud;
type FactorInforme = { episodioId: number; factor: string };

export type OpcionesInforme = {
  desde: string;
  hasta: string;
  hoy: string;
  /** Permite generar el informe con datos ya resueltos (pruebas o vistas previas). */
  datos?: {
    episodios: EpisodioInforme[];
    factores: FactorInforme[];
  };
};

export async function generarInforme({
  desde,
  hasta,
  hoy,
  datos,
}: OpcionesInforme) {
  const episodios = datos
    ? datos.episodios.filter(
        (episodio) =>
          episodio.inicioEn >= desde && episodio.inicioEn <= `${hasta}T23:59`,
      )
    : await db
        .select()
        .from(saludEpisodios)
        .where(
          and(
            gte(saludEpisodios.inicioEn, desde),
            lte(saludEpisodios.inicioEn, `${hasta}T23:59`),
          ),
        )
        .orderBy(asc(saludEpisodios.inicioEn));

  const ids = episodios.map((episodio) => episodio.id);
  const factores = datos
    ? datos.factores
    : ids.length > 0
      ? await db
          .select()
          .from(saludEpisodioDesencadenantes)
          .where(inArray(saludEpisodioDesencadenantes.episodioId, ids))
      : [];

  const factoresPorEpisodio = new Map<number, string[]>();
  for (const fila of factores) {
    const lista = factoresPorEpisodio.get(fila.episodioId) ?? [];
    lista.push(fila.factor);
    factoresPorEpisodio.set(fila.episodioId, lista);
  }

  const conteoFactores = new Map<string, number>();
  for (const lista of factoresPorEpisodio.values()) {
    for (const factor of lista) {
      conteoFactores.set(factor, (conteoFactores.get(factor) ?? 0) + 1);
    }
  }

  const conteoSintomas = new Map<string, number>();
  for (const episodio of episodios) {
    for (const sintoma of episodio.sintomas) {
      conteoSintomas.set(sintoma, (conteoSintomas.get(sintoma) ?? 0) + 1);
    }
  }

  const diasConEpisodio = new Set(
    episodios.map((episodio) => episodio.inicioEn.slice(0, 10)),
  );
  const dias = diasEntre(desde, hasta);
  const diasLibres = Math.max(0, dias - diasConEpisodio.size);

  const duraciones = episodios
    .map((episodio) =>
      episodio.finEn ? minutosEntre(episodio.inicioEn, episodio.finEn) : null,
    )
    .filter((valor): valor is number => valor !== null && valor > 0);

  const conTetralgin = episodios.filter(
    (episodio) => episodio.tomoTetralgin && episodio.alivio !== null,
  );
  const conAlivio = conTetralgin.filter(
    (episodio) =>
      episodio.alivio === "completo" || episodio.alivio === "parcial",
  );

  const evaPromedio = promedio(episodios.map((episodio) => episodio.intensidad));
  const duracionPromedio = promedio(duraciones);
  const efectividad =
    conTetralgin.length > 0
      ? Math.round((conAlivio.length / conTetralgin.length) * 100)
      : null;

  // ── Documento ────────────────────────────────────────────────────────────
  const documento = await PDFDocument.create();
  const normal = await documento.embedFont(StandardFonts.Helvetica);
  const negrita = await documento.embedFont(StandardFonts.HelveticaBold);
  const cursiva = await documento.embedFont(StandardFonts.HelveticaOblique);

  documento.setTitle(`Informe de migraña ${desde} - ${hasta}`);
  documento.setSubject("Informe médico de seguimiento de migraña");
  documento.setCreator("Mi Dashboard");

  const paginas: PDFPage[] = [];
  let pagina = documento.addPage(A4);
  paginas.push(pagina);
  let y = A4[1] - MARGEN;

  const escribir = (
    texto: string,
    opciones: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      x?: number;
      maxWidth?: number;
      lineHeight?: number;
      desdeY?: number;
    } = {},
  ) => {
    const font = opciones.font ?? normal;
    const size = opciones.size ?? 10;
    const color = opciones.color ?? COLOR.carbon;
    const x = opciones.x ?? MARGEN;
    const maxWidth = opciones.maxWidth ?? ANCHO_UTIL;
    const alturaLinea = opciones.lineHeight ?? size * 1.45;
    const lineas = envolver(texto, font, size, maxWidth);

    for (const linea of lineas) {
      pagina.drawText(linea, { x, y, size, font, color });
      y -= alturaLinea;
    }

    return lineas.length;
  };

  const nuevaPagina = () => {
    pagina = documento.addPage(A4);
    paginas.push(pagina);
    y = A4[1] - MARGEN;
  };

  const asegurar = (espacio: number) => {
    if (y - espacio < MARGEN + 32) nuevaPagina();
  };

  const tituloSeccion = (texto: string) => {
    asegurar(42);
    pagina.drawRectangle({
      x: MARGEN,
      y: y - 3,
      width: 14,
      height: 3,
      color: COLOR.lima,
    });
    y -= 14;
    escribir(texto.toUpperCase(), {
      font: negrita,
      size: 9,
      color: COLOR.tinta,
      lineHeight: 13,
    });
    y -= 6;
  };

  // Encabezado
  pagina.drawRectangle({
    x: 0,
    y: A4[1] - 118,
    width: A4[0],
    height: 118,
    color: COLOR.tinta,
  });

  pagina.drawText(limpiar("INFORME DE SALUD"), {
    x: MARGEN,
    y: A4[1] - 44,
    size: 9,
    font: negrita,
    color: COLOR.lima,
  });
  pagina.drawText(limpiar("Migraña y bienestar"), {
    x: MARGEN,
    y: A4[1] - 70,
    size: 24,
    font: negrita,
    color: COLOR.blanco,
  });
  pagina.drawText(
    limpiar(`Período: ${formatearFecha(desde)} al ${formatearFecha(hasta)}`),
    {
      x: MARGEN,
      y: A4[1] - 92,
      size: 10,
      font: normal,
      color: COLOR.blanco,
    },
  );
  pagina.drawText(limpiar(`Generado el ${formatearFecha(hoy)}`), {
    x: A4[0] - MARGEN - 120,
    y: A4[1] - 92,
    size: 8,
    font: normal,
    color: COLOR.lima,
  });

  y = A4[1] - 146;

  // Resumen
  tituloSeccion("Resumen del período");

  const resumen: Array<[string, string]> = [
    ["Episodios", String(episodios.length)],
    ["Días con crisis", String(diasConEpisodio.size)],
    ["Días libres", String(diasLibres)],
    ["Intensidad media (EVA)", evaPromedio !== null ? `${evaPromedio}/10` : "-"],
    [
      "Duración media",
      duracionPromedio !== null
        ? `${Math.floor(duracionPromedio / 60)} h ${
            Math.round(duracionPromedio % 60)
          } min`
        : "-",
    ],
    ["Con aura", `${episodios.filter((episodio) => episodio.aura).length}`],
    ["Con Tetralgin", `${conTetralgin.length}`],
    ["Alivio con Tetralgin", efectividad !== null ? `${efectividad}%` : "-"],
  ];

  const anchoCaja = (ANCHO_UTIL - 12) / 4;
  const altoCaja = 52;

  for (let indice = 0; indice < resumen.length; indice += 1) {
    const columna = indice % 4;
    if (columna === 0 && indice > 0) y -= altoCaja + 8;

    asegurar(altoCaja + 8);

    const [etiqueta, valor] = resumen[indice];
    const x = MARGEN + columna * (anchoCaja + 4);

    pagina.drawRectangle({
      x,
      y: y - altoCaja,
      width: anchoCaja,
      height: altoCaja,
      color: COLOR.fondo,
      borderColor: COLOR.linea,
      borderWidth: 0.7,
    });
    pagina.drawText(limpiar(etiqueta), {
      x: x + 8,
      y: y - 16,
      size: 7,
      font: normal,
      color: COLOR.gris,
    });
    pagina.drawText(limpiar(valor), {
      x: x + 8,
      y: y - 36,
      size: 14,
      font: negrita,
      color: COLOR.tinta,
    });
  }

  y -= altoCaja + 20;

  // Desencadenantes y síntomas
  tituloSeccion("Desencadenantes más frecuentes");

  if (conteoFactores.size === 0) {
    escribir("No se registraron desencadenantes en el período.", {
      size: 9,
      color: COLOR.gris,
      font: cursiva,
    });
    y -= 8;
  } else {
    const ranking = [...conteoFactores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    for (const [factor, cantidad] of ranking) {
      asegurar(18);
      const porcentaje =
        episodios.length > 0
          ? Math.round((cantidad / episodios.length) * 100)
          : 0;

      pagina.drawText(limpiar(etiquetaFactor(factor)), {
        x: MARGEN,
        y,
        size: 9,
        font: normal,
        color: COLOR.carbon,
      });
      pagina.drawText(limpiar(`${cantidad} (${porcentaje}%)`), {
        x: A4[0] - MARGEN - 50,
        y,
        size: 9,
        font: negrita,
        color: COLOR.tinta,
      });

      pagina.drawRectangle({
        x: MARGEN + 210,
        y: y + 1,
        width: 180,
        height: 4,
        color: COLOR.linea,
      });
      pagina.drawRectangle({
        x: MARGEN + 210,
        y: y + 1,
        width: Math.max(4, (180 * porcentaje) / 100),
        height: 4,
        color: COLOR.lima,
      });

      y -= 15;
    }
    y -= 8;
  }

  if (conteoSintomas.size > 0) {
    const sintomas = [...conteoSintomas.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([sintoma, cantidad]) => `${etiquetaSintoma(sintoma)} (${cantidad})`)
      .join(", ");
    escribir(`Síntomas acompañantes: ${sintomas}.`, {
      size: 8,
      color: COLOR.gris,
      font: cursiva,
      lineHeight: 12,
    });
    y -= 8;
  }

  // Episodios
  tituloSeccion("Episodios registrados");

  if (episodios.length === 0) {
    escribir("No hay episodios registrados en este período.", {
      size: 9,
      color: COLOR.gris,
      font: cursiva,
    });
  } else {
    for (const episodio of episodios) {
      const inicio = `${formatearFecha(
        episodio.inicioEn.slice(0, 10),
      )} · ${horaDe(episodio.inicioEn)}`;
      const cierre = episodio.finEn
        ? `${horaDe(episodio.finEn)} (${duracion(episodio)})`
        : "en curso";

      const dolor = [
        episodio.patron
          ? (PATRONES_POR_VALOR.get(episodio.patron) ?? episodio.patron)
          : null,
        episodio.lateralidad
          ? (LATERALIDADES_POR_VALOR.get(episodio.lateralidad) ??
            episodio.lateralidad)
          : null,
        episodio.aura ? "con aura" : "sin aura",
      ]
        .filter(Boolean)
        .join(" · ");

      const tetralgin = episodio.tomoTetralgin
        ? `Tetralgin: ${episodio.dosisTetralgin ?? "-"} comprimido(s)${
            episodio.tetralginEn ? ` a las ${horaDe(episodio.tetralginEn)}` : ""
          } · ${
            episodio.alivio
              ? (ALIVIOS_POR_VALOR.get(episodio.alivio) ?? episodio.alivio)
              : "sin respuesta registrada"
          }`
        : "Sin Tetralgin";

      const listaFactores = factoresPorEpisodio.get(episodio.id) ?? [];

      // Cada bloque se calcula antes de dibujarse para que no se corte entre
      // dos páginas ni invada el pie.
      const detalle: Array<{
        texto: string;
        color: ReturnType<typeof rgb>;
        font: PDFFont;
      }> = [{ texto: dolor, color: COLOR.gris, font: normal }];

      if (episodio.aura && episodio.auraTipos.length > 0) {
        detalle.push({
          texto: `Aura: ${episodio.auraTipos
            .map((tipo) => etiquetaAura(tipo))
            .join(", ")}`,
          color: COLOR.gris,
          font: normal,
        });
      }

      if (episodio.sintomas.length > 0) {
        detalle.push({
          texto: `Síntomas: ${episodio.sintomas
            .map((sintoma) => etiquetaSintoma(sintoma))
            .join(", ")}`,
          color: COLOR.gris,
          font: normal,
        });
      }

      detalle.push({ texto: tetralgin, color: COLOR.carbon, font: normal });

      if (listaFactores.length > 0) {
        detalle.push({
          texto: `Desencadenantes: ${listaFactores
            .map((factor) => etiquetaFactor(factor))
            .join(", ")}`,
          color: COLOR.gris,
          font: normal,
        });
      }

      if (episodio.notas) {
        detalle.push({
          texto: `Notas: ${episodio.notas}`,
          color: COLOR.gris,
          font: normal,
        });
      }

      const alturaDetalle = detalle.reduce(
        (total, linea) =>
          total + envolver(linea.texto, linea.font, 8, ANCHO_UTIL).length * 11,
        0,
      );

      asegurar(14 + alturaDetalle + 20);

      pagina.drawText(limpiar(inicio), {
        x: MARGEN,
        y,
        size: 9.5,
        font: negrita,
        color: COLOR.tinta,
      });
      pagina.drawText(limpiar(`Cierre: ${cierre}`), {
        x: MARGEN + 220,
        y,
        size: 8.5,
        font: normal,
        color: COLOR.carbon,
      });
      pagina.drawText(limpiar(`EVA ${episodio.intensidad}/10`), {
        x: A4[0] - MARGEN - 54,
        y,
        size: 9.5,
        font: negrita,
        color:
          episodio.intensidad >= 8
            ? rgb(0.796, 0.153, 0.184)
            : COLOR.tinta,
      });
      y -= 14;

      for (const linea of detalle) {
        escribir(linea.texto, {
          size: 8,
          color: linea.color,
          font: linea.font,
          lineHeight: 11,
        });
      }

      y -= 4;
      pagina.drawLine({
        start: { x: MARGEN, y },
        end: { x: A4[0] - MARGEN, y },
        thickness: 0.6,
        color: COLOR.linea,
      });
      y -= 12;
    }
  }

  // Nota final
  if (y < MARGEN + 40) nuevaPagina();
  escribir(
    "Este informe es un resumen de los registros personales y no reemplaza la evaluación de un profesional de la salud.",
    { size: 7.5, color: COLOR.gris, font: cursiva, lineHeight: 10 },
  );

  // Pie de página
  const totalPaginas = paginas.length;
  paginas.forEach((item, indice) => {
    item.drawText(
      limpiar(
        `Informe de migraña · ${formatearFecha(desde)} - ${formatearFecha(
          hasta,
        )} · Página ${indice + 1} de ${totalPaginas}`,
      ),
      {
        x: MARGEN,
        y: 24,
        size: 7,
        font: normal,
        color: COLOR.gris,
      },
    );
    item.drawText(limpiar("Generado desde Mi Dashboard"), {
      x: A4[0] - MARGEN - 92,
      y: 24,
      size: 7,
      font: normal,
      color: COLOR.gris,
    });
  });

  const bytes = await documento.save();

  return {
    bytes: new Uint8Array(bytes),
    nombre: `informe-migrana-${desde}-a-${hasta}.pdf`,
  };
}
