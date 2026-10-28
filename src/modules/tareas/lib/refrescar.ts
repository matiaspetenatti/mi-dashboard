import "server-only";

import { revalidatePath, updateTag } from "next/cache";

export function refrescarTareas() {
  updateTag("tareas");
  revalidatePath("/tareas");
  revalidatePath("/");
}
