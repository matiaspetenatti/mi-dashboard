import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import { SALUD_TAG } from "../constantes";

/** Invalida la caché del módulo y refresca la ruta y el hub. */
export function invalidarSalud() {
  updateTag(SALUD_TAG);
  revalidatePath("/salud");
  revalidatePath("/");
}
