import { Suspense } from "react";
import { crearMateria } from "@/modules/estudio/actions";
import { EstudioContenido } from "@/modules/estudio/contenido";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function EstudioPage() {
  await requireAuthorizedUser();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Estudio</h1>

      <form action={crearMateria} className="flex gap-2">
        <input
          name="nombre"
          placeholder="Nueva materia..."
          required
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">
          Agregar
        </button>
      </form>

      <Suspense fallback={<p className="text-sm text-neutral-500">Cargando...</p>}>
        <EstudioContenido />
      </Suspense>
    </div>
  );
}