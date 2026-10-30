"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type {
  EstadoProyecto,
  Etiqueta,
  Proyecto,
} from "@/modules/tareas/schema";
import type {
  ResumenProyecto,
  VistaConConfig,
} from "@/modules/tareas/queries/proyectos";
import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import {
  fusionarConfig,
  type ConfigVista,
  type FiltrosVista,
} from "@/modules/tareas/lib/config-vista";
import { alternarCompletada } from "@/modules/tareas/actions/tareas";
import { actualizarVista } from "@/modules/tareas/actions/vistas";
import { estadoInicial } from "@/modules/tareas/lib/orden";
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
import { EncabezadoProyecto } from "./encabezado-proyecto";
import { VistasTabs, iconosVista } from "./vistas-tabs";
import { BarraHerramientas } from "./barra-herramientas";
import { QuickAdd } from "./quick-add";
import { PanelTarea, type ProyectoConEstados } from "./panel-tarea";
import { VistaLista } from "./vistas/lista";
import { VistaTablero } from "./vistas/tablero";
import { VistaTabla } from "./vistas/tabla";
import { VistaCalendario } from "./vistas/calendario";
import { VistaCronograma } from "./vistas/cronograma";

type WorkspaceProps = {
  proyecto: Proyecto;
  estados: EstadoProyecto[];
  vistas: VistaConConfig[];
  tareas: TareaConDetalle[];
  etiquetas: Etiqueta[];
  resumen: ResumenProyecto[];
  vistaInicial: number | null;
  tareaAbierta: number | null;
  mes: string;
  hoy: string;
};

export function Workspace({
  proyecto,
  estados,
  vistas,
  tareas,
  etiquetas,
  resumen,
  vistaInicial,
  tareaAbierta,
  mes,
  hoy,
}: WorkspaceProps) {
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [vistaId, setVistaId] = useState<number | null>(vistaInicial);
  const [tareaId, setTareaId] = useState<number | null>(tareaAbierta);
  const [mesActivo, setMesActivo] = useState(mes);

  const vistaActiva =
    vistas.find((vista) => vista.id === vistaId) ??
    vistas.find((vista) => vista.predeterminada) ??
    vistas[0] ??
    null;

  const {
    tareas: tareasVisibles,
    aplicar,
    descartar,
  } = useCambiosOptimistas(tareas, estados, etiquetas);
  const { programar, inmediato } = useRefrescoDiferido();

  const tareaSeleccionada =
    tareasVisibles.find((tarea) => tarea.id === tareaId) ?? null;

  const total = tareasVisibles.length;
  const completadas = tareasVisibles.filter(
    (tarea) => tarea.estado.categoria === "completado",
  ).length;
  const pendientes = tareasVisibles.filter(
    (tarea) =>
      tarea.estado.categoria === "pendiente" ||
      tarea.estado.categoria === "en_progreso",
  ).length;
  const vencidas = tareasVisibles.filter(
    (tarea) =>
      (tarea.estado.categoria === "pendiente" ||
        tarea.estado.categoria === "en_progreso") &&
      tarea.fechaLimite !== null &&
      tarea.fechaLimite < hoy,
  ).length;
  const progreso = total === 0 ? 0 : Math.round((completadas / total) * 100);

  const proyectosConEstados: ProyectoConEstados[] = resumen.map(
    ({ proyecto: item, estados: estadosProyecto }) => ({
      id: item.id,
      nombre: item.nombre,
      color: item.color,
      estados: estadosProyecto,
    }),
  );

  useEffect(() => {
    function alVolver() {
      const parametros = new URLSearchParams(window.location.search);
      const vista = Number(parametros.get("vista"));
      const tarea = Number(parametros.get("tarea"));
      const mesUrl = parametros.get("mes");

      setVistaId(Number.isInteger(vista) && vista > 0 ? vista : null);
      setTareaId(Number.isInteger(tarea) && tarea > 0 ? tarea : null);
      if (mesUrl && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesUrl)) {
        setMesActivo(mesUrl);
      }
    }

    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  function sincronizarUrl(
    vista: VistaConConfig | null,
    tarea: number | null,
    mesValor: string,
  ) {
    const parametros = new URLSearchParams();
    if (vista) parametros.set("vista", String(vista.id));
    if (tarea) parametros.set("tarea", String(tarea));
    if (vista?.tipo === "calendario") parametros.set("mes", mesValor);

    const consulta = parametros.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${consulta ? `?${consulta}` : ""}`,
    );
  }

  function abrirTarea(id: number) {
    if (!vistaActiva) return;
    setTareaId(id);
    sincronizarUrl(vistaActiva, id, mesActivo);
  }

  function cerrarTarea() {
    setTareaId(null);
    sincronizarUrl(vistaActiva, null, mesActivo);
  }

  function seleccionarVista(id: number) {
    const siguiente = vistas.find((vista) => vista.id === id) ?? null;
    setVistaId(id);
    setTareaId(null);
    sincronizarUrl(siguiente, null, mesActivo);
  }

  function cambiarMes(valor: string) {
    setMesActivo(valor);
    sincronizarUrl(vistaActiva, tareaId, valor);
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

  return (
    <div className="space-y-4">
      <div className="min-w-0 flex-1 space-y-4">
        <EncabezadoProyecto
          proyecto={proyecto}
          total={total}
          completadas={completadas}
          pendientes={pendientes}
          vencidas={vencidas}
          progreso={progreso}
        />

        {vistaActiva ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <VistasTabs
                proyectoId={proyecto.id}
                vistas={vistas}
                activaId={vistaActiva.id}
                onSeleccionar={seleccionarVista}
              />
              <span className="text-[11px] text-on-surface-variant">
                {tareasVisibles.length}{" "}
                {tareasVisibles.length === 1 ? "tarea" : "tareas"}
              </span>
            </div>

            <ContenidoVista
              key={vistaActiva.id}
              proyecto={proyecto}
              vista={vistaActiva}
              estados={estados}
              etiquetas={etiquetas}
              tareas={tareasVisibles}
              hoy={hoy}
              mes={mesActivo}
              onAbrir={abrirTarea}
              onAlternar={alternar}
              onCambiarMes={cambiarMes}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant/70 px-6 py-14 text-center text-sm text-on-surface-variant">
            Este proyecto todavía no tiene vistas. Creá una desde los ajustes.
          </div>
        )}
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
        estados={estados}
        etiquetas={etiquetas}
        proyectos={proyectosConEstados}
      />
    </div>
  );
}

function ContenidoVista({
  proyecto,
  vista,
  estados,
  etiquetas,
  tareas,
  hoy,
  mes,
  onAbrir,
  onAlternar,
  onCambiarMes,
}: {
  proyecto: Proyecto;
  vista: VistaConConfig;
  estados: EstadoProyecto[];
  etiquetas: Etiqueta[];
  tareas: TareaConDetalle[];
  hoy: string;
  mes: string;
  onAbrir: (id: number) => void;
  onAlternar: (id: number) => void;
  onCambiarMes: (mes: string) => void;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<ConfigVista>(vista.config);
  const [guardando, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sucio = JSON.stringify(config) !== JSON.stringify(vista.config);
  const Icono = iconosVista[vista.tipo];
  const hechas = tareas.filter(
    (tarea) =>
      tarea.estado.categoria === "completado" ||
      tarea.estado.categoria === "cancelado",
  ).length;

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

  function guardar() {
    setError(null);
    startTransition(async () => {
      const resultado = await actualizarVista(vista.id, { config });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar la vista");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <BarraHerramientas
        config={config}
        estados={estados}
        etiquetas={etiquetas}
        completadas={hechas}
        sucio={sucio}
        guardando={guardando}
        onCambiar={cambiar}
        onGuardar={guardar}
      />

      {error && (
        <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
          {error}
        </p>
      )}

      <div className="flex items-center gap-1.5 px-1 text-[11px] text-on-surface-variant">
        <Icono size={12} />
        Vista {vista.nombre}
        {guardando && <Loader2 size={11} className="animate-spin" />}
        {sucio && !guardando && (
          <span className="text-primary">· cambios sin guardar</span>
        )}
      </div>

      {(vista.tipo === "lista" ||
        vista.tipo === "tablero" ||
        vista.tipo === "tabla") && (
        <QuickAdd
          proyectoId={proyecto.id}
          estados={estados}
          estadoId={estadoInicial(estados)?.id}
        />
      )}

      {vista.tipo === "lista" && (
        <VistaLista
          tareas={tareas}
          estados={estados}
          etiquetas={etiquetas}
          config={config}
          hoy={hoy}
          onAbrir={onAbrir}
          onAlternar={onAlternar}
        />
      )}
      {vista.tipo === "tablero" && (
        <VistaTablero
          tareas={tareas}
          estados={estados}
          etiquetas={etiquetas}
          config={config}
          hoy={hoy}
          onAbrir={onAbrir}
          onAlternar={onAlternar}
        />
      )}
      {vista.tipo === "tabla" && (
        <VistaTabla
          tareas={tareas}
          estados={estados}
          etiquetas={etiquetas}
          config={config}
          hoy={hoy}
          onAbrir={onAbrir}
          onAlternar={onAlternar}
        />
      )}
      {vista.tipo === "calendario" && (
        <VistaCalendario
          tareas={tareas}
          etiquetas={etiquetas}
          config={config}
          mes={mes}
          hoy={hoy}
          onCambiarMes={onCambiarMes}
          onAbrir={onAbrir}
        />
      )}
      {vista.tipo === "cronograma" && (
        <VistaCronograma
          tareas={tareas}
          estados={estados}
          etiquetas={etiquetas}
          config={config}
          hoy={hoy}
          onAbrir={onAbrir}
        />
      )}
    </>
  );
}
