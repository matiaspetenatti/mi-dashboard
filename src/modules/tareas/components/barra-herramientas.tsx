"use client";

import {
  ArrowUpDown,
  Check,
  ChevronDown,
  CircleCheckBig,
  Loader2,
  Save,
  Search,
} from "lucide-react";
import type { EstadoProyecto, Etiqueta } from "@/modules/tareas/schema";
import {
  agrupaciones,
  configVistaBase,
  etiquetasAgrupacion,
  etiquetasOrden,
  ordenesTarea,
  type ConfigVista,
  type FiltrosVista,
} from "@/modules/tareas/lib/config-vista";
import { cn } from "cn";
import { Menu, MenuEtiqueta, MenuItem, MenuSeparador } from "./ui/menu";
import { PanelFiltros } from "./filtros-vista";

export function BarraHerramientas({
  config,
  estados,
  etiquetas,
  completadas,
  sucio,
  guardando,
  onCambiar,
  onGuardar,
  mostrarToggleCompletadas = true,
}: {
  config: ConfigVista;
  estados: EstadoProyecto[];
  etiquetas: Etiqueta[];
  completadas: number;
  sucio: boolean;
  guardando: boolean;
  onCambiar: (cambios: {
    filtros?: Partial<FiltrosVista>;
    agruparPor?: ConfigVista["agruparPor"];
    orden?: ConfigVista["orden"];
    sentido?: ConfigVista["sentido"];
    mostrarCompletadas?: boolean;
    mostrarSubtareas?: boolean;
  }) => void;
  onGuardar: () => void;
  mostrarToggleCompletadas?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-outline-variant/50 bg-surface-container-low/40 p-1.5">
      <PanelFiltros
        config={config}
        estados={estados}
        etiquetas={etiquetas}
        onCambiar={onCambiar}
      />

      <Menu
        ariaLabel="Agrupar tareas"
        trigger={
          <>
            <span className="text-on-surface-variant">Agrupar:</span>
            <span className="font-medium">{etiquetasAgrupacion[config.agruparPor]}</span>
            <ChevronDown size={12} className="text-on-surface-variant" />
          </>
        }
        triggerClassName="rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-low"
      >
        <MenuEtiqueta>Agrupar por</MenuEtiqueta>
        {agrupaciones.map((agrupacion) => (
          <MenuItem
            key={agrupacion}
            activo={config.agruparPor === agrupacion}
            onClick={() => onCambiar({ agruparPor: agrupacion })}
          >
            <span className="flex-1">{etiquetasAgrupacion[agrupacion]}</span>
            {config.agruparPor === agrupacion && <Check size={13} />}
          </MenuItem>
        ))}
        <MenuSeparador />
        <MenuItem
          onClick={() =>
            onCambiar({ mostrarSubtareas: !config.mostrarSubtareas })
          }
        >
          <span className="flex-1">Mostrar subtareas</span>
          {config.mostrarSubtareas && <Check size={13} />}
        </MenuItem>
      </Menu>

      <Menu
        ariaLabel="Ordenar tareas"
        trigger={
          <>
            <ArrowUpDown size={12} className="text-on-surface-variant" />
            <span className="font-medium">{etiquetasOrden[config.orden]}</span>
            <ChevronDown size={12} className="text-on-surface-variant" />
          </>
        }
        triggerClassName="rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container-low"
      >
        <MenuEtiqueta>Ordenar por</MenuEtiqueta>
        {ordenesTarea.map((orden) => (
          <MenuItem
            key={orden}
            activo={config.orden === orden}
            onClick={() => onCambiar({ orden })}
          >
            <span className="flex-1">{etiquetasOrden[orden]}</span>
            {config.orden === orden && <Check size={13} />}
          </MenuItem>
        ))}
        <MenuSeparador />
        <MenuItem
          onClick={() =>
            onCambiar({ sentido: config.sentido === "asc" ? "desc" : "asc" })
          }
        >
          <span className="flex-1">
            {config.sentido === "asc" ? "Ascendente" : "Descendente"}
          </span>
        </MenuItem>
      </Menu>

      {mostrarToggleCompletadas && (
        <button
          type="button"
          aria-pressed={config.mostrarCompletadas}
          onClick={() =>
            onCambiar({ mostrarCompletadas: !config.mostrarCompletadas })
          }
          title={
            config.mostrarCompletadas
              ? "Ocultar tareas completadas y canceladas"
              : "Mostrar tareas completadas y canceladas"
          }
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition-colors",
            config.mostrarCompletadas
              ? "border-primary/40 bg-primary-container text-on-primary-container"
              : "border-outline-variant/70 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
          )}
        >
          <CircleCheckBig size={12} />
          Hechas
          {completadas > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] font-semibold leading-4",
                config.mostrarCompletadas
                  ? "bg-on-primary-container/10"
                  : "bg-on-surface/10",
              )}
            >
              {completadas}
            </span>
          )}
        </button>
      )}

      <label className="ml-auto flex min-w-40 flex-1 items-center gap-1.5 rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 py-1 sm:max-w-64">
        <Search size={12} className="shrink-0 text-on-surface-variant" />
        <input
          value={config.filtros.busqueda}
          onChange={(event) =>
            onCambiar({ filtros: { busqueda: event.target.value } })
          }
          placeholder="Buscar tareas..."
          className="h-5 min-w-0 flex-1 bg-transparent text-xs text-on-surface outline-none placeholder:text-on-surface-variant/60"
          aria-label="Buscar tareas"
        />
      </label>

      {sucio && (
        <button
          type="button"
          disabled={guardando}
          onClick={onGuardar}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-on-primary transition-opacity",
            guardando && "opacity-70",
          )}
        >
          {guardando ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Guardar vista
        </button>
      )}

      <button
        type="button"
        onClick={() => onCambiar({ ...configVistaBase, filtros: configVistaBase.filtros })}
        className="rounded-full px-2 py-1.5 text-[11px] text-on-surface-variant hover:bg-on-surface/5"
        title="Restablecer vista"
      >
        Restablecer
      </button>
    </div>
  );
}
