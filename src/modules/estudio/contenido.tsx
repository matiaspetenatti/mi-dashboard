import {
  BookOpenCheck,
  CalendarClock,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNota } from "@/lib/format";
import { getEstudioData } from "./queries";
import { BotonNuevaCarrera } from "./components/boton-nueva-carrera";
import { TarjetaCarrera } from "./components/tarjeta-carrera";
import { FilaExamen } from "./components/fila-examen";
import { PomodoroTimer } from "./components/pomodoro-timer";

export function EstudioSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Skeleton key={indice} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, indice) => (
          <Skeleton key={indice} className="h-64 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export async function EstudioContenido() {
  const { carreras, proximosExamenes, resumen, hoy } = await getEstudioData();

  const estadisticas = [
    {
      etiqueta: "Carreras activas",
      valor: resumen.carrerasActivas,
      detalle: `${resumen.totalCarreras} en total`,
      icono: GraduationCap,
      clase: "bg-tertiary-container text-on-tertiary-container",
    },
    {
      etiqueta: "Materias aprobadas",
      valor: resumen.aprobadas,
      detalle: `de ${resumen.totalPlan} del plan`,
      icono: BookOpenCheck,
      clase: "bg-success-container text-on-success-container",
    },
    {
      etiqueta: "Promedio general",
      valor:
        resumen.promedio !== null ? formatNota(resumen.promedio) : "—",
      detalle: "Sobre materias aprobadas",
      icono: TrendingUp,
      clase: "bg-primary-container text-on-primary-container",
    },
    {
      etiqueta: "Próximos exámenes",
      valor: resumen.proximosExamenes,
      detalle:
        resumen.proximosExamenes === 1 ? "examen agendado" : "exámenes agendados",
      icono: CalendarClock,
      clase: "bg-secondary-container text-on-secondary-container",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-container px-3 py-1 text-xs font-medium text-on-tertiary-container">
            <GraduationCap size={13} />
            Recorrido académico
          </span>
        }
        title="Estudio"
        description="Seguí el avance de tus carreras, las materias, las notas y los próximos exámenes."
        actions={<BotonNuevaCarrera />}
      />

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {estadisticas.map((stat) => {
          const Icono = stat.icono;
          return (
            <div
              key={stat.etiqueta}
              className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3.5"
            >
              <span
                className={`grid size-8 place-items-center rounded-full ${stat.clase}`}
              >
                <Icono size={15} />
              </span>
              <p className="mt-2.5 text-2xl font-medium leading-none text-on-surface">
                {stat.valor}
              </p>
              <p className="mt-1 text-xs font-medium text-on-surface">
                {stat.etiqueta}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {stat.detalle}
              </p>
            </div>
          );
        })}
      </section>

      {carreras.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-outline-variant/80 bg-surface-container-lowest/60 px-6 py-14 text-center">
          <GraduationCap
            size={28}
            className="mx-auto text-on-surface-variant"
          />
          <p className="mt-3 text-base font-medium text-on-surface">
            Empezá cargando tu primera carrera
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-on-surface-variant">
            Después podés agregar las materias, sus notas y las fechas de
            examen para ver tu progreso.
          </p>
          <div className="mt-4 flex justify-center">
            <BotonNuevaCarrera />
          </div>
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Mis carreras
              </h2>
              <span className="text-[11px] text-on-surface-variant">
                {carreras.length}{" "}
                {carreras.length === 1 ? "carrera" : "carreras"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {carreras.map((item) => (
                <TarjetaCarrera
                  key={item.carrera.id}
                  resumen={item}
                  hoy={hoy}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Próximos exámenes
              </h2>
              <span className="text-[11px] text-on-surface-variant">
                {proximosExamenes.length}{" "}
                {proximosExamenes.length === 1 ? "examen" : "exámenes"}
              </span>
            </div>

            {proximosExamenes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-lowest/60 px-4 py-8 text-center text-sm text-on-surface-variant">
                No hay exámenes programados por delante.
              </p>
            ) : (
              <ul className="space-y-2">
                {proximosExamenes.map((examen) => (
                  <FilaExamen
                    key={examen.id}
                    examen={examen}
                    hoy={hoy}
                    mostrarCarrera
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Pomodoro
              </h2>
              <span className="text-[11px] text-on-surface-variant">
                Temporizador de estudio
              </span>
            </div>
            <PomodoroTimer
              carreras={carreras.map((c) => ({
                id: c.carrera.id,
                nombre: c.carrera.nombre,
              }))}
            />
          </section>
        </>
      )}
    </div>
  );
}
