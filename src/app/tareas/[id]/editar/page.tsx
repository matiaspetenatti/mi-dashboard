import { Suspense } from "react";
import { FormEditar } from "@/modules/tareas/form-editar";

export default function EditarTareaPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <div className="max-w-xl space-y-6">
            <h1 className="text-2xl font-semibold">Editar tarea</h1>
            <Suspense fallback={<p className="text-sm text-neutral-500">Cargando...</p>}>
                <FormEditar params={params} />
            </Suspense>
        </div>
    );
}