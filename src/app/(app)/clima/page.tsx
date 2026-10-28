import { Suspense } from "react";
import { CloudSun, MapPin } from "lucide-react";
import { requireAuthorizedUser } from "@/lib/auth";
import {
  getClimaData,
  getUbicacionClima,
  getUbicacionesClima,
} from "@/modules/clima/queries";
import { ClimaContenido, ClimaSkeleton } from "@/modules/clima/contenido";
import { DialogoUbicacion } from "@/modules/clima/components/dialogo-ubicacion";
import { SelectorUbicacion } from "@/modules/clima/components/selector-ubicacion";
import { formatearCoordenadas } from "@/modules/clima/clima-utils";
import type { UbicacionClima } from "@/modules/clima/types";

export const instant = false;

async function ClimaPronostico({ ubicacion }: { ubicacion: UbicacionClima }) {
  const data = await getClimaData(ubicacion);
  return <ClimaContenido data={data} />;
}

export default async function ClimaPage() {
  await requireAuthorizedUser();
  const [ubicaciones, ubicacion] = await Promise.all([
    getUbicacionesClima(),
    getUbicacionClima(),
  ]);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
              <CloudSun className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                Clima
              </h1>
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-on-surface-variant">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-on-surface">
                  {ubicacion.etiqueta}
                </span>
                <span className="tabular-nums text-on-surface-variant">
                  ({formatearCoordenadas(ubicacion.latitud, ubicacion.longitud)})
                </span>
              </p>
            </div>
          </div>

          <DialogoUbicacion ubicaciones={ubicaciones} activa={ubicacion} />
        </div>

        <SelectorUbicacion ubicaciones={ubicaciones} activa={ubicacion} />
      </div>

      <Suspense fallback={<ClimaSkeleton />}>
        <ClimaPronostico ubicacion={ubicacion} />
      </Suspense>
    </div>
  );
}
