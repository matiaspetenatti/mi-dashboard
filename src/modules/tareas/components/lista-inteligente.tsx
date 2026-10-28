"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  CircleCheckBig,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { ResumenProyecto } from "@/modules/tareas/queries/proyectos";
import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import type { Etiqueta } from "@/modules/tareas/schema";
import {
  configVistaBase,
  fusionarConfig,
  type ConfigVista,
  type FiltrosVista,
} from "@/modules/tareas/lib/config-vista";
import { filtrarTareas } from "@/modules/tareas/lib/filtrar";
import { alternarCompletada } from "@/modules/tareas/actions/tareas";
import {
  buscarTarea,
  destinoAlAlternar,
  destinoAlReabrir,
} from "@/modules/tareas/lib/optimista";
import {
  useCambiosOptimistas,
  useRefrescoDiferido,
} from "@/modules/tareas/lib/use-cambios";
import { useToast } from "@/hooks/use-toast";
import { NavProyectos } from "./nav-proyectos";
import { BarraHerramientas } from "./barra-herramientas";
import { VistaLista } from "./vistas/lista";
import { PanelTarea, type ProyectoConEstados } from "./panel-tarea";

export type ListaInteligenteSlug =
  | "hoy"
  | "proximas"
  | "vencidas"
  | "sin-fecha"
  | "completadas"
  | "todas";

const definiciones = {
  hoy: {
    titulo: "Hoy",
    descripcion: "Tareas que vencen hoy en todos los proyectos.",
    icon: Sparkles,
  },
  proximas: {
    titulo: "Próximas",
    descripcion: "Lo que viene en los próximos siete días.",
    icon: CalendarClock,
  },
  vencidas: {
    titulo: "Vencidas",
    descripcion: "Tareas cuya fecha límite ya pasó.",
    icon: TriangleAlert,
  },
  "sin-fecha": {
    titulo: "Sin fecha",
    descripcion: "Tareas pendientes que todavía no tienen fecha.",
    icon: CalendarDays,
  },
  completadas: {
    titulo: "Completadas",
    descripcion: "Lo que ya terminaste, en todos los proyectos.",
    icon: CircleCheckBig,
  },
  todas: {
    titulo: "Todas las tareas",
    descripcion: "Una mirada completa a todos los proyectos.",
    icon: CheckSquare,
  },
} satisfies Record<
  ListaInteligenteSlug,
  { titulo: string; descripcion: string; icon: typeof Sparkles }
>;

function sumar(fecha: string, dias: number) {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function incluirEnLista(
  tarea: TareaConDetalle,
  lista: ListaInteligenteSlug,
  hoy: string,
) {
  if (lista === "completadas") return tarea.estado.categoria === "completado";
  if (lista === "todas") return true;
  if (
    tarea.estado.categoria !== "pendiente" &&
    tarea.estado.categoria !== "en_progreso"
  ) {
    return false;
  }
  if (lista === "sin-fecha") return !tarea.fechaLimite;
  if (!tarea.fechaLimite) return false;
  if (lista === "hoy") return tarea.fechaLimite === hoy;
  if (lista === "vencidas") return tarea.fechaLimite < hoy;
  return tarea.fechaLimite > hoy && tarea.fechaLimite <= sumar(hoy, 7);
}

export function ListaInteligente({
  lista,
  tareas,
  proyectos,
  etiquetas,
  tareaAbierta,
  hoy,
}: {
  lista: ListaInteligenteSlug;
  tareas: TareaConDetalle[];
  proyectos: ResumenProyecto[];
  etiquetas: Etiqueta[];
  tareaAbierta: number | null;
  hoy: string;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const definicion = definiciones[lista];
  const Icono = definicion.icon;

  const [tareaId, setTareaId] = useState<number | null>(tareaAbierta);
  const estados = proyectos.flatMap((item) => item.estados);
  const {
    tareas: tareasVisibles,
    aplicar,
    descartar,
  } = useCambiosOptimistas(tareas, estados, etiquetas);
  const { programar, inmediato } = useRefrescoDiferido();

  const filtradas = tareasVisibles.filter((tarea) =>
    incluirEnLista(tarea, lista, hoy),
  );
  const hechas = tareasVisibles.filter(
    (tarea) =>
      tarea.estado.categoria === "completado" ||
      tarea.estado.categoria === "cancelado",
  ).length;
  const tareaSeleccionada =
    tareasVisibles.find((tarea) => tarea.id === tareaId) ?? null;
  const estadosSeleccionada = tareaSeleccionada
    ? (proyectos.find(
        (item) => item.proyecto.id === tareaSeleccionada.proyectoId,
      )?.estados ?? [])
    : [];

  const proyectosConEstados: ProyectoConEstados[] = proyectos.map(
    ({ proyecto, estados: estadosProyecto }) => ({
      id: proyecto.id,
      nombre: proyecto.nombre,
      color: proyecto.color,
      estados: estadosProyecto,
    }),
  );

  const [config, setConfig] = useState<ConfigVista>({
    ...configVistaBase,
    agruparPor: "proyecto",
    mostrarCompletadas: lista === "todas" || lista === "completadas",
    ...(lista === "completadas"
      ? { orden: "completada" as const, sentido: "desc" as const }
      : {}),
  });

  function cambiar(cambios: {
    filtros?: Partial<FiltrosVista>;
    agruparPor?: ConfigVista["agruparPor"];
    orden?: ConfigVista["orden"];
    sentido?: ConfigVista["sentido"];
    mostrarCompletadas?: boolean;
    mostrarSubtareas?: boolean;
  }) {
    setConfig((previo) =>
      fusionarConfig(previo, {
        ...cambios,
        filtros: { ...previo.filtros, ...(cambios.filtros ?? {}) },
      }),
    );
  }

  function abrirTarea(id: number) {
    setTareaId(id);
    window.history.replaceState(null, "", `/tareas?lista=${lista}&tarea=${id}`);
  }

  function cerrarTarea() {
    setTareaId(null);
    window.history.replaceState(null, "", `/tareas?lista=${lista}`);
  }

  function alternar(id: number) {
    const objetivo = buscarTarea(tareasVisibles, id);
    if (!objetivo) return;

    const estabaHecha = objetivo.estado.categoria === "completado";
    const destino = destinoAlAlternar(estados, objetivo);
    if (!destino) {
      toast.error(
        estabaHecha
          ? "No hay un estado pendiente en el proyecto"
          : "El proyecto no tiene un estado completado",
      );
      return;
    }

    aplicar(id, { estadoId: destino.id });

    startTransition(async () => {
      const resultado = await alternarCompletada(id);
      if (!resultado.ok) {
        descartar(id);
        toast.error(resultado.error ?? "No se pudo actualizar la tarea");
        return;
      }

      if (estabaHecha) {
        toast.info("Tarea reabierta", { description: objetivo.titulo });
      } else {
        toast.success("Tarea completada", {
          description: objetivo.titulo,
          action: {
            label: "Deshacer",
            onClick: () => reabrirTarea(id, objetivo.titulo),
          },
        });
      }

      programar();
    });
  }

  function reabrirTarea(id: number, titulo: string) {
    const destino = destinoAlReabrir(estados);
    if (destino) aplicar(id, { estadoId: destino.id });

    startTransition(async () => {
      const resultado = await alternarCompletada(id);
      if (!resultado.ok) {
        descartar(id);
        toast.error(resultado.error ?? "No se pudo reabrir la tarea");
        return;
      }
      toast.info("Tarea reabierta", { description: titulo });
      programar();
    });
  }

  const cantidad = filtrarTareas(filtradas, config, hoy).length;

  return (
    <div className="flex gap-6">
      <NavProyectos
        proyectos={proyectos}
        listaActiva={lista}
        className="hidden w-52 shrink-0 lg:block"
      />

      <div className="min-w-0 flex-1 space-y-4">
        <div>
          <Link
            href="/tareas"
            className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface"
          >
            <ArrowLeft size={11} />
            Volver al resumen
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
              <Icono size={16} />
            </span>
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-on-surface">
                {definicion.titulo}
              </h1>
              <p className="text-xs text-on-surface-variant">
                {definicion.descripcion}
              </p>
            </div>
            <span className="ml-auto rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
              {cantidad}
            </span>
          </div>
        </div>

        <BarraHerramientas
          config={config}
          estados={estados}
          etiquetas={etiquetas}
          completadas={hechas}
          sucio={false}
          guardando={false}
          onCambiar={cambiar}
          onGuardar={() => {}}
          mostrarToggleCompletadas={lista !== "completadas"}
        />

        <VistaLista
          tareas={filtradas}
          estados={estados}
          etiquetas={etiquetas}
          config={config}
          hoy={hoy}
          onAbrir={abrirTarea}
          onAlternar={alternar}
          mostrarProyecto={config.agruparPor !== "proyecto"}
        />
      </div>

      <PanelTarea
        tarea={tareaSeleccionada}
        abierto={tareaSeleccionada !== null}
        onCerrar={cerrarTarea}
        onAbrirTarea={abrirTarea}
        onAlternar={alternar}
        onCambioLocal={aplicar}
        onDescartarCambio={descartar}
        onGuardado={() => programar()}
        onRefrescar={inmediato}
        estados={estadosSeleccionada}
        etiquetas={etiquetas}
        proyectos={proyectosConEstados}
      />
    </div>
  );
}
