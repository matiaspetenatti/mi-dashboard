import { NextResponse } from "next/server";
import { ANIMES_POR_PAGINA } from "@/modules/animes/schema";
import { rejectUnauthorizedRequest } from "@/lib/auth";
import {
  getAnimesVistos,
  getAnimesMetadatos,
  type AnimesFiltros,
} from "@/modules/animes/queries";

export async function GET(req: Request) {
  const denied = await rejectUnauthorizedRequest();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const estado = (searchParams.get("estado") as AnimesFiltros["estado"]) || "todos";
    const tipo = searchParams.get("tipo") || undefined;
    const genero = searchParams.get("genero") || undefined;
    const ordenarPor =
      (searchParams.get("ordenar") as AnimesFiltros["ordenarPor"]) ||
      "puntaje_desc";
    const q = searchParams.get("q") || undefined;
    const anoDesde = searchParams.get("anoDesde") ? Number(searchParams.get("anoDesde")) : undefined;
    const anoHasta = searchParams.get("anoHasta") ? Number(searchParams.get("anoHasta")) : undefined;
    const fechaDesde = searchParams.get("fechaDesde") || undefined;
    const fechaHasta = searchParams.get("fechaHasta") || undefined;
    const temporada = searchParams.get("temporada") || undefined;
    const pagina = searchParams.get("pagina") ? Number(searchParams.get("pagina")) : 1;
    const limite = searchParams.get("limite")
      ? Number(searchParams.get("limite"))
      : ANIMES_POR_PAGINA;

    const [resultado, metadatos] = await Promise.all([
      getAnimesVistos({
        estado,
        tipo,
        genero,
        ordenarPor,
        q,
        anoDesde,
        anoHasta,
        fechaDesde,
        fechaHasta,
        temporada,
        pagina,
        limite,
      }),
      getAnimesMetadatos(),
    ]);

    const { animes, total, pagina: paginaActual, limite: limiteActual, totalPaginas } = resultado;

    return NextResponse.json({
      animes,
      paginacion: {
        total,
        pagina: paginaActual,
        limite: limiteActual,
        totalPaginas,
      },
      metadatos,
    });
  } catch {
    return NextResponse.json(
      {
        animes: [],
        paginacion: { total: 0, pagina: 1, limite: ANIMES_POR_PAGINA, totalPaginas: 1 },
        metadatos: { tipos: [], generos: [], anos: [], temporadas: [] },
      },
      { status: 200 },
    );
  }
}
