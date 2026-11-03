import { connection } from "next/server";
import { requireAuthorizedUser } from "@/lib/auth";
import { getTareasGlobales } from "@/modules/tareas/queries";
import { Estadisticas } from "@/modules/tareas/components/estadisticas";

export const instant = false;

export default async function EstadisticasPage() {
  await requireAuthorizedUser();
  await connection();
  const tareas = await getTareasGlobales();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-heading">Estadísticas</h1>
      <Estadisticas tareas={tareas} />
    </div>
  );
}