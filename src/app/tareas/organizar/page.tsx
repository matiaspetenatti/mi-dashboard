import Link from "next/link";
import { Suspense } from "react";
import { Organizar } from "@/modules/tareas/organizar";

export default function OrganizarPage() {
    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Tags y grupos</h1>
                <Link href="/tareas" className="text-sm text-neutral-500 hover:text-neutral-900">
                    ← Volver a tareas
                </Link>
            </div>
            <Suspense fallback={<p className="text-sm text-neutral-500">Cargando...</p>}>
                <Organizar />
            </Suspense>
        </div>
    );
}