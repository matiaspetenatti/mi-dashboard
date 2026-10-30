import { NextResponse, type NextRequest } from "next/server";
import { rejectUnauthorizedRequest } from "@/lib/auth";
import { fechaHoy } from "@/lib/format";
import { diasEntre, generarInforme } from "@/modules/salud/lib/informe";

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DIAS = 366;

export async function GET(request: NextRequest) {
  const rechazo = await rejectUnauthorizedRequest();
  if (rechazo) return rechazo;

  const hoy = fechaHoy();
  const desde =
    request.nextUrl.searchParams.get("desde") ?? `${hoy.slice(0, 7)}-01`;
  const hasta = request.nextUrl.searchParams.get("hasta") ?? hoy;

  if (!REGEX_FECHA.test(desde) || !REGEX_FECHA.test(hasta)) {
    return NextResponse.json(
      { error: "Las fechas tienen que tener formato YYYY-MM-DD" },
      { status: 400 },
    );
  }

  if (desde > hasta) {
    return NextResponse.json(
      { error: "La fecha inicial no puede ser posterior a la final" },
      { status: 400 },
    );
  }

  if (diasEntre(desde, hasta) > MAX_DIAS) {
    return NextResponse.json(
      { error: `El informe admite un rango máximo de ${MAX_DIAS} días` },
      { status: 400 },
    );
  }

  const { bytes, nombre } = await generarInforme({ desde, hasta, hoy });

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
