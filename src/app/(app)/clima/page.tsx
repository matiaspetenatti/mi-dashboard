import { Suspense } from "react";
import { requireAuthorizedUser } from "@/lib/auth";
import { getClimaData } from "@/modules/clima/queries";
import { ClimaContenido, ClimaSkeleton } from "@/modules/clima/contenido";
import { CloudSun } from "lucide-react";

export const instant = false;

export default async function ClimaPage() {
  await requireAuthorizedUser();
  const data = await getClimaData();

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
            <CloudSun className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Clima
            </h1>
            <p className="text-sm text-neutral-500">
              Pronóstico meteorológico (Coordenadas: -33.1478, -64.3562)
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<ClimaSkeleton />}>
        <ClimaContenido data={data} />
      </Suspense>
    </div>
  );
}
