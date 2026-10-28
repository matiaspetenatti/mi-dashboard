"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  GitBranch,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Star,
  Table2,
  Trash2,
} from "lucide-react";
import type { VistaConConfig } from "@/modules/tareas/queries/proyectos";
import type { TipoVista } from "@/modules/tareas/constantes";
import { etiquetasTipoVista, tiposVista } from "@/modules/tareas/constantes";
import {
  actualizarVista,
  borrarVista,
  crearVista,
  duplicarVista,
  marcarVistaPredeterminada,
} from "@/modules/tareas/actions/vistas";
import { cn } from "cn";
import { Dialogo } from "@/components/ui/dialogo";
import { Menu, MenuItem, MenuSeparador } from "./ui/menu";

export const iconosVista: Record<TipoVista, typeof List> = {
  lista: List,
  tablero: LayoutGrid,
  tabla: Table2,
  calendario: CalendarDays,
  cronograma: GitBranch,
};

export function VistasTabs({
  proyectoId,
  vistas,
  activaId,
  onSeleccionar,
}: {
  proyectoId: number;
  vistas: VistaConConfig[];
  activaId: number;
  onSeleccionar: (id: number) => void;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [creando, setCreando] = useState(false);
  const [renombrando, setRenombrando] = useState(false);
  const [duplicando, setDuplicando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoVista>("lista");
  const [error, setError] = useState<string | null>(null);

  const activa = vistas.find((vista) => vista.id === activaId) ?? vistas[0];

  function crear() {
    const valor = nombre.trim();
    if (!valor) return;
    startTransition(async () => {
      const resultado = await crearVista({
        proyectoId,
        nombre: valor,
        tipo,
      });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo crear la vista");
        return;
      }
      setCreando(false);
      setNombre("");
      setTipo("lista");
      router.refresh();
      onSeleccionar(resultado.id);
    });
  }

  function renombrar() {
    if (!activa) return;
    const valor = nombre.trim();
    if (!valor) return;
    startTransition(async () => {
      const resultado = await actualizarVista(activa.id, { nombre: valor });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo renombrar");
        return;
      }
      setRenombrando(false);
      setNombre("");
      router.refresh();
    });
  }

  function duplicar() {
    if (!activa) return;
    const valor = nombre.trim();
    if (!valor) return;
    startTransition(async () => {
      const resultado = await duplicarVista(activa.id, valor);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo duplicar");
        return;
      }
      setDuplicando(false);
      setNombre("");
      router.refresh();
      onSeleccionar(resultado.id);
    });
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full bg-surface-container/70 p-0.5">
        {vistas.map((vista) => {
          const Icono = iconosVista[vista.tipo];
          const activaActual = vista.id === activa?.id;
          return (
            <button
              key={vista.id}
              type="button"
              onClick={() => onSeleccionar(vista.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors",
                activaActual
                  ? "bg-surface-container-lowest text-on-surface shadow-elevation-1"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
              aria-current={activaActual ? "page" : undefined}
            >
              <Icono size={12} />
              <span className="max-w-32 truncate">{vista.nombre}</span>
              {vista.predeterminada && (
                <Star size={9} className="text-on-surface-variant/60" />
              )}
            </button>
          );
        })}
      </div>

      {activa && (
        <Menu
          ariaLabel="Opciones de la vista"
          align="start"
          trigger={<ChevronDown size={13} />}
          triggerClassName="grid size-7 place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/5"
        >
          <MenuItem
            onClick={() => {
              setNombre(activa.nombre);
              setError(null);
              setRenombrando(true);
            }}
          >
            Renombrar vista
          </MenuItem>
          <MenuItem
            onClick={() => {
              setNombre(`${activa.nombre} (copia)`);
              setError(null);
              setDuplicando(true);
            }}
          >
            <Copy size={13} />
            Duplicar vista
          </MenuItem>
          <MenuItem
            activo={activa.predeterminada}
            onClick={() => {
              startTransition(async () => {
                await marcarVistaPredeterminada(activa.id);
                router.refresh();
              });
            }}
          >
            <Star size={13} />
            {activa.predeterminada ? "Es la predeterminada" : "Predeterminada"}
            {activa.predeterminada && <Check size={13} className="ml-auto" />}
          </MenuItem>
          <MenuSeparador />
          <MenuItem
            peligro
            onClick={() => {
              setError(null);
              setEliminando(true);
            }}
          >
            <Trash2 size={13} />
            Eliminar vista
          </MenuItem>
        </Menu>
      )}

      <button
        type="button"
        aria-label="Nueva vista"
        onClick={() => {
          setNombre("");
          setTipo("lista");
          setError(null);
          setCreando(true);
        }}
        className="grid size-7 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/5"
      >
        <Plus size={14} />
      </button>

      <Dialogo
        abierto={creando}
        onOpenChange={setCreando}
        titulo="Nueva vista"
        descripcion="Las vistas se guardan en este proyecto."
      >
        <CampoVista
          nombre={nombre}
          tipo={tipo}
          onNombre={setNombre}
          onTipo={setTipo}
          error={error}
          pendiente={pendiente}
          texto="Crear vista"
          onConfirmar={crear}
          onCancelar={() => setCreando(false)}
        />
      </Dialogo>

      <Dialogo
        abierto={renombrando}
        onOpenChange={setRenombrando}
        titulo="Renombrar vista"
      >
        <CampoVista
          nombre={nombre}
          onNombre={setNombre}
          error={error}
          pendiente={pendiente}
          texto="Guardar"
          onConfirmar={renombrar}
          onCancelar={() => setRenombrando(false)}
          soloNombre
        />
      </Dialogo>

      <Dialogo
        abierto={duplicando}
        onOpenChange={setDuplicando}
        titulo="Duplicar vista"
        descripcion="Se copia la configuración actual de la vista."
      >
        <CampoVista
          nombre={nombre}
          onNombre={setNombre}
          error={error}
          pendiente={pendiente}
          texto="Duplicar"
          onConfirmar={duplicar}
          onCancelar={() => setDuplicando(false)}
          soloNombre
        />
      </Dialogo>

      <Dialogo
        abierto={eliminando}
        onOpenChange={setEliminando}
        titulo="Eliminar vista"
        descripcion="Esta acción no se puede deshacer."
      >
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            ¿Eliminar “{activa?.nombre}”?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEliminando(false)}
              className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                if (!activa) return;
                startTransition(async () => {
                  const resultado = await borrarVista(activa.id);
                  if (!resultado.ok) {
                    setError(resultado.error ?? "No se pudo eliminar");
                    return;
                  }
                  setEliminando(false);
                  router.refresh();
                  const restante = vistas.find((vista) => vista.id !== activa.id);
                  if (restante) onSeleccionar(restante.id);
                });
              }}
              className="rounded-full bg-error-container px-4 py-2 text-sm font-medium text-on-error-container disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Dialogo>
    </div>
  );
}

function CampoVista({
  nombre,
  tipo,
  onNombre,
  onTipo,
  error,
  pendiente,
  texto,
  onConfirmar,
  onCancelar,
  soloNombre = false,
}: {
  nombre: string;
  tipo?: TipoVista;
  onNombre: (valor: string) => void;
  onTipo?: (valor: TipoVista) => void;
  error: string | null;
  pendiente: boolean;
  texto: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  soloNombre?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-on-surface-variant">
        Nombre
        <input
          autoFocus
          value={nombre}
          onChange={(event) => onNombre(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onConfirmar();
            }
          }}
          className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
        />
      </label>

      {!soloNombre && tipo && onTipo && (
        <label className="block text-xs font-medium text-on-surface-variant">
          Tipo
          <select
            value={tipo}
            onChange={(event) => onTipo(event.target.value as TipoVista)}
            className="mt-1 h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
          >
            {tiposVista.map((opcion) => (
              <option key={opcion} value={opcion}>
                {etiquetasTipoVista[opcion]}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <p className="rounded-lg bg-error-container px-2 py-1.5 text-xs text-on-error-container">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pendiente || !nombre.trim()}
          onClick={onConfirmar}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
        >
          {pendiente && <Loader2 size={13} className="animate-spin" />}
          {texto}
        </button>
      </div>
    </div>
  );
}
