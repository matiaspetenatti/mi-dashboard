import { Bitacora } from "./components/bitacora";
import { GraficoIntensidad } from "./components/grafico-intensidad";
import { SaludKpis } from "./components/kpis";
import { MapaDesencadenantes } from "./components/mapa-desencadenantes";
import { RegistroRapido } from "./components/registro-rapido";
import type { ResumenSalud } from "./queries";

export function VistaMigrana({
  data,
  ahora,
}: {
  data: ResumenSalud;
  ahora: string;
}) {
  const enCurso = data.episodios.find((episodio) => !episodio.finEn) ?? null;
  const ultimo = data.episodios[0] ?? null;
  const registroHoy =
    data.diario.find((registro) => registro.fecha === data.hoy) ?? null;

  return (
    <div className="space-y-5">
      <RegistroRapido
        enCurso={enCurso}
        ultimo={ultimo}
        registroHoy={registroHoy}
        ahora={ahora}
      />

      <SaludKpis data={data} />

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <GraficoIntensidad serie={data.serie} />
        </div>
        <div className="lg:col-span-4">
          <MapaDesencadenantes mapa={data.mapa} />
        </div>
      </div>

      <Bitacora episodios={data.episodios} ahora={ahora} />
    </div>
  );
}
