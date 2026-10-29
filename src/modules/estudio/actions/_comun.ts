import { revalidatePath } from "next/cache";

export type ResultadoAccion<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export function errorAccion(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

export function refrescarEstudio(carreraId?: number) {
  revalidatePath("/estudio");
  if (carreraId) {
    revalidatePath(`/estudio/carreras/${carreraId}`);
  }
  revalidatePath("/");
}

export function mensajeError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.includes("UNIQUE")) {
    return "Ya existe un registro con ese nombre";
  }
  return fallback;
}
