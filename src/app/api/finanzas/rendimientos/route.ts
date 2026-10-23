import { NextResponse } from "next/server";
import { prepararFinanzas } from "@/modules/finanzas/rendimientos";
import { FINANZAS_TAG } from "@/modules/finanzas/cache-tags";
import { revalidatePath, revalidateTag } from "next/cache";
import { rejectUnauthorizedRequest } from "@/lib/auth";

export async function GET() {
  const denied = await rejectUnauthorizedRequest();
  if (denied) return denied;

  try {
    const res = await prepararFinanzas();
    revalidateTag(FINANZAS_TAG, { expire: 0 });
    revalidatePath("/finanzas");
    revalidatePath("/");
    return NextResponse.json({
      ok: true,
      mensaje: "Rendimientos diarios procesados correctamente",
      generados: res.totalGenerados,
      totalMontoCentavos: res.totalMontoCentavos,
    });
  } catch (error) {
    console.error("Error en cron de rendimientos:", error);
    return NextResponse.json(
      { ok: false, error: "Error al procesar rendimientos" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
