import { Suspense } from "react";
import { MapPin } from "lucide-react";
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
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
          Ahora mismo
        </p>
        <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
          Clima
        </h1>
        <p className="mt-1 max-w-xl text-sm text-charcoal">
          El estado del cielo de hoy y el pronóstico de los próximos días.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-container text-on-primary-container">
            <MapPin className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-charcoal">
              {ubicacion.etiqueta}
            </p>
            <p className="text-xs tabular-nums text-pebble">
              {formatearCoordenadas(ubicacion.latitud, ubicacion.longitud)}
            </p>
          </div>
        </div>

        <DialogoUbicacion
          ubicaciones={ubicaciones}
          activa={ubicacion}
        />
      </div>

      <SelectorUbicacion ubicaciones={ubicaciones} activa={ubicacion} />

      <Suspense fallback={<ClimaSkeleton />}>
        <ClimaPronostico ubicacion={ubicacion} />
      </Suspense>
    </div>
  );
}
