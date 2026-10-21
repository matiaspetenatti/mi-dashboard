import { Suspense } from "react";
import { crearTarea } from "@/modules/tareas/actions";
import { ListaTareas } from "@/modules/tareas/lista-tareas";

export default function TareasPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Tareas</h1>

      <form action={crearTarea} className="flex gap-2">
        <input
          name="titulo"
          placeholder="Nueva tarea..."
          required
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <input type="date" name="fechaLimite" className="rounded-md border px-3 py-2 text-sm" />
        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">
          Agregar
        </button>
      </form>

      <Suspense fallback={<p className="text-sm text-neutral-500">Cargando tareas...</p>}>
        <ListaTareas />
      </Suspense>
    </div>
  );
}