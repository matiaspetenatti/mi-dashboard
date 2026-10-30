import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import { COMIDA_HREF, COMIDA_TAG } from "../constantes";

/** Invalida la caché del módulo y refresca la ruta y el hub. */
export function invalidarComida() {
  updateTag(COMIDA_TAG);
  revalidatePath(COMIDA_HREF);
  revalidatePath("/");
}
