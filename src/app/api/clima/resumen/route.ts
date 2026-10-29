import { getClimaResumen } from "@/modules/clima/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const resumen = await getClimaResumen();
    return NextResponse.json(resumen);
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener el resumen del clima" },
      { status: 500 },
    );
  }
}
