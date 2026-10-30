"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  FileClock,
  Loader2,
  Pencil,
  Pill,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import {
  cerrarEpisodio,
  eliminarEpisodio,
} from "../actions/episodios";
import {
  ALIVIOS_POR_VALOR,
  LATERALIDADES_POR_VALOR,
  PATRONES_POR_VALOR,
  etiquetaAura,
  etiquetaFactor,
  etiquetaSintoma,
  nivelDolor,
} from "../constantes";
import {
  fechaHoraAhora,
  formatearDuracion,
  formatearFechaHoraCorta,
  minutosEntre,
  partirEnFechaHora,
} from "../lib/fechas";
import type { EpisodioConFactores } from "../queries";
import { CAMPO, CAMPO_SELECT, Campo } from "./campos";
import { FormularioEpisodio } from "./formulario-episodio";

type Filtro = "todos" | "aura" | "severa" | "curso";

const FILTROS: Array<{ valor: Filtro; label: string }> = [
  { valor: "todos", label: "Todos los episodios" },
  { valor: "aura", label: "Solo con aura" },
  { valor: "severa", label: "Intensidad severa (8+)" },
  { valor: "curso", label: "En curso" },
];

function duracionTexto(episodio: EpisodioConFactores) {
  if (!episodio.finEn) return "En curso";
  const minutos = minutosEntre(episodio.inicioEn, episodio.finEn);
  return formatearDuracion(minutos);
}

function descripcionDolor(episodio: EpisodioConFactores) {
  const partes = [
    episodio.patron
      ? (PATRONES_POR_VALOR.get(episodio.patron) ?? episodio.patron)
      : null,
    episodio.lateralidad
      ? (LATERALIDADES_POR_VALOR.get(episodio.lateralidad) ??
        episodio.lateralidad)
      : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : "Sin especificar";
}

function etiquetaAlivio(episodio: EpisodioConFactores) {
  if (!episodio.tomoTetralgin) return "No tomó";
  if (!episodio.alivio) return "Sin respuesta";
  return ALIVIOS_POR_VALOR.get(episodio.alivio) ?? episodio.alivio;
}

function ChipEpisodio({
  children,
  tono = "neutro",
}: {
  children: React.ReactNode;
  tono?: "neutro" | "verde" | "ambar" | "rojo";
}) {
  const tonos = {
    neutro: "bg-surface-container text-on-surface-variant",
    verde: "bg-success-container text-on-success-container",
    ambar: "bg-warning-container text-on-warning-container",
    rojo: "bg-error-container text-on-error-container",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        tonos[tono],
      )}
    >
      {children}
    </span>
  );
}

function AccionesEpisodio({
  episodio,
  onEditar,
  onCerrar,
  onEliminar,
  pendiente,
}: {
  episodio: EpisodioConFactores;
  onEditar: () => void;
  onCerrar: () => void;
  onEliminar: () => void;
  pendiente: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {!episodio.finEn && (
        <button
          type="button"
          onClick={onCerrar}
          disabled={pendiente}
          title="Cerrar episodio"
          aria-label="Cerrar episodio"
          className="grid size-7 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-success-container hover:text-on-success-container disabled:opacity-40"
        >
          <CheckCircle2 size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onEditar}
        disabled={pendiente}
        title="Editar episodio"
        aria-label="Editar episodio"
        className="grid size-7 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-heading disabled:opacity-40"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={onEliminar}
        disabled={pendiente}
        title="Eliminar episodio"
        aria-label="Eliminar episodio"
        className="grid size-7 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function Bitacora({
  episodios,
  ahora,
}: {
  episodios: EpisodioConFactores[];
  ahora: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [editando, setEditando] = useState<EpisodioConFactores | null>(null);
  const [cerrando, setCerrando] = useState<EpisodioConFactores | null>(null);
  const [cierreFecha, setCierreFecha] = useState("");
  const [cierreHora, setCierreHora] = useState("");
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const visibles = useMemo(() => {
    if (filtro === "aura") return episodios.filter((e) => e.aura);
    if (filtro === "severa") return episodios.filter((e) => e.intensidad >= 8);
    if (filtro === "curso") return episodios.filter((e) => !e.finEn);
    return episodios;
  }, [episodios, filtro]);

  const enCurso = episodios.filter((episodio) => !episodio.finEn).length;

  function abrirCierre(episodio: EpisodioConFactores) {
    const { fecha, hora } = partirEnFechaHora(fechaHoraAhora());
    setCierreFecha(fecha);
    setCierreHora(hora);
    setCerrando(episodio);
    setError(null);
  }

  function confirmarCierre() {
    if (!cerrando) return;

    if (!cierreFecha || !cierreHora) {
      setError("Completá fecha y hora de cierre");
      return;
    }

    const finEn = `${cierreFecha}T${cierreHora}`;
    const minutos = minutosEntre(cerrando.inicioEn, finEn);
    if (minutos !== null && minutos <= 0) {
      setError("El cierre tiene que ser posterior al inicio");
      return;
    }

    setError(null);
    startTransition(async () => {
      const resultado = await cerrarEpisodio(cerrando.id, finEn);

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      toast.success("Episodio cerrado", {
        description: "Se actualizó la duración de la crisis.",
      });
      setCerrando(null);
      router.refresh();
    });
  }

  function eliminar(episodio: EpisodioConFactores) {
    if (
      !confirm(
        `¿Eliminar el episodio del ${formatearFechaHoraCorta(
          episodio.inicioEn,
        )}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const resultado = await eliminarEpisodio(episodio.id);

      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }

      toast.success("Episodio eliminado");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-outline-variant/40 bg-card shadow-elevation-1">
      <div className="flex flex-col gap-3 border-b border-outline-variant/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-heading">
            Bitácora de episodios
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
              {episodios.length}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-charcoal">
            Registro histórico para revisar en la consulta médica.
            {enCurso > 0 && (
              <span className="ml-1 font-semibold text-primary">
                {enCurso} en curso.
              </span>
            )}
          </p>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-pebble">
          <span className="shrink-0">Filtrar:</span>
          <select
            value={filtro}
            onChange={(event) => setFiltro(event.target.value as Filtro)}
            className={cn(CAMPO_SELECT, "h-9 w-auto min-w-44 text-xs")}
          >
            {FILTROS.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
          <FileClock size={26} className="text-primary" />
          <p className="text-sm font-semibold text-heading">
            {episodios.length === 0
              ? "Todavía no hay episodios registrados"
              : "Ningún episodio coincide con el filtro"}
          </p>
          <p className="max-w-sm text-xs text-on-surface-variant">
            {episodios.length === 0
              ? "Registrá tu primer episodio para empezar a ver patrones y llevar un historial."
              : "Probá con otro filtro para ver el resto de la bitácora."}
          </p>
        </div>
      ) : (
        <>
          {/* Tabla (desktop) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/40 text-[10px] font-semibold uppercase tracking-wider text-pebble">
                  <th className="px-4 py-3">Fecha y horario</th>
                  <th className="px-4 py-3">EVA</th>
                  <th className="px-4 py-3">Aura / localización</th>
                  <th className="px-4 py-3">Síntomas</th>
                  <th className="px-4 py-3">Tetralgin</th>
                  <th className="px-4 py-3">Respuesta</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {visibles.map((episodio) => {
                  const nivel = nivelDolor(episodio.intensidad);

                  return (
                    <tr
                      key={episodio.id}
                      className="align-top transition-colors hover:bg-surface-container-low/60"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-heading">
                          {formatearFechaHoraCorta(episodio.inicioEn)}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-on-surface-variant">
                          <Clock size={11} />
                          {duracionTexto(episodio)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <ChipEpisodio
                          tono={
                            episodio.intensidad >= 8
                              ? "rojo"
                              : episodio.intensidad >= 4
                                ? "ambar"
                                : "verde"
                          }
                        >
                          {episodio.intensidad}/10
                        </ChipEpisodio>
                        <p className="mt-1 text-[11px] text-on-surface-variant">
                          {nivel.label}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-charcoal">
                          {episodio.aura ? "Con aura" : "Sin aura"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-on-surface-variant">
                          {descripcionDolor(episodio)}
                        </p>
                        {episodio.aura && episodio.auraTipos.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-pebble">
                            {episodio.auraTipos
                              .map((tipo) => etiquetaAura(tipo))
                              .join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="max-w-52 px-4 py-3.5">
                        {episodio.sintomas.length === 0 ? (
                          <span className="text-[11px] text-pebble">—</span>
                        ) : (
                          <p className="text-[11px] leading-relaxed text-charcoal">
                            {episodio.sintomas
                              .map((sintoma) => etiquetaSintoma(sintoma))
                              .join(", ")}
                          </p>
                        )}
                        {episodio.factores.length > 0 && (
                          <p className="mt-1 line-clamp-2 text-[10px] text-pebble">
                            {episodio.factores
                              .map((factor) => etiquetaFactor(factor))
                              .join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {episodio.tomoTetralgin ? (
                          <span className="inline-flex items-center gap-1 font-medium text-charcoal">
                            <Pill size={12} className="text-primary" />
                            {episodio.dosisTetralgin ?? "—"}{" "}
                            {(episodio.dosisTetralgin ?? 0) === 1
                              ? "comp."
                              : "comps."}
                          </span>
                        ) : (
                          <span className="text-[11px] text-pebble">No</span>
                        )}
                        {episodio.tetralginEn && (
                          <p className="mt-0.5 text-[10px] text-on-surface-variant">
                            {partirEnFechaHora(episodio.tetralginEn).hora} h
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[11px] font-medium text-charcoal">
                          {etiquetaAlivio(episodio)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <AccionesEpisodio
                          episodio={episodio}
                          pendiente={pendiente}
                          onEditar={() => setEditando(episodio)}
                          onCerrar={() => abrirCierre(episodio)}
                          onEliminar={() => eliminar(episodio)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <ul className="divide-y divide-outline-variant/30 md:hidden">
            {visibles.map((episodio) => {
              const nivel = nivelDolor(episodio.intensidad);

              return (
                <li key={episodio.id} className="space-y-2.5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-heading">
                        {formatearFechaHoraCorta(episodio.inicioEn)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-on-surface-variant">
                        <Clock size={11} />
                        {duracionTexto(episodio)}
                      </p>
                    </div>
                    <ChipEpisodio
                      tono={
                        episodio.intensidad >= 8
                          ? "rojo"
                          : episodio.intensidad >= 4
                            ? "ambar"
                            : "verde"
                      }
                    >
                      EVA {episodio.intensidad} · {nivel.label}
                    </ChipEpisodio>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <ChipEpisodio tono={episodio.aura ? "verde" : "neutro"}>
                      {episodio.aura ? "Con aura" : "Sin aura"}
                    </ChipEpisodio>
                    {episodio.tomoTetralgin && (
                      <ChipEpisodio tono="neutro">
                        <Pill size={10} /> {episodio.dosisTetralgin ?? "—"}{" "}
                        {(episodio.dosisTetralgin ?? 0) === 1
                          ? "comp."
                          : "comps."}
                      </ChipEpisodio>
                    )}
                    <ChipEpisodio tono="neutro">
                      {etiquetaAlivio(episodio)}
                    </ChipEpisodio>
                  </div>

                  <p className="text-[11px] text-on-surface-variant">
                    <span className="font-semibold text-charcoal">
                      {descripcionDolor(episodio)}
                    </span>
                    {episodio.sintomas.length > 0 && (
                      <>
                        {" · "}
                        {episodio.sintomas
                          .map((sintoma) => etiquetaSintoma(sintoma))
                          .join(", ")}
                      </>
                    )}
                  </p>

                  {episodio.factores.length > 0 && (
                    <p className="text-[10px] leading-relaxed text-pebble">
                      {episodio.factores
                        .map((factor) => etiquetaFactor(factor))
                        .join(" · ")}
                    </p>
                  )}

                  <AccionesEpisodio
                    episodio={episodio}
                    pendiente={pendiente}
                    onEditar={() => setEditando(episodio)}
                    onCerrar={() => abrirCierre(episodio)}
                    onEliminar={() => eliminar(episodio)}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Modal de edición */}
      <Dialogo
        abierto={editando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setEditando(null);
        }}
        titulo="Editar episodio"
        descripcion="Actualizá los datos del episodio y guardá los cambios."
        className="max-w-3xl"
      >
        {editando && (
          <FormularioEpisodio
            key={editando.id}
            episodio={editando}
            ahora={ahora}
            onGuardado={() => setEditando(null)}
            onCancelar={() => setEditando(null)}
          />
        )}
      </Dialogo>

      {/* Modal de cierre */}
      <Dialogo
        abierto={cerrando !== null}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setCerrando(null);
            setError(null);
          }
        }}
        titulo="Cerrar episodio"
        descripcion={
          cerrando
            ? `El episodio empezó el ${formatearFechaHoraCorta(
                cerrando.inicioEn,
              )}.`
            : undefined
        }
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Fecha de cierre">
              <input
                type="date"
                value={cierreFecha}
                onChange={(event) => setCierreFecha(event.target.value)}
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Hora de cierre">
              <input
                type="time"
                value={cierreHora}
                onChange={(event) => setCierreHora(event.target.value)}
                className={CAMPO}
              />
            </Campo>
          </div>

          {cerrando && cierreFecha && cierreHora && (
            <p className="text-xs text-on-surface-variant">
              Duración:{" "}
              <span className="font-semibold text-heading">
                {formatearDuracion(
                  minutosEntre(cerrando.inicioEn, `${cierreFecha}T${cierreHora}`),
                )}
              </span>
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-error/20 bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCerrando(null)}
              disabled={pendiente}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarCierre}
              disabled={pendiente}
            >
              {pendiente ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Cerrar episodio
            </Button>
          </div>
        </div>
      </Dialogo>
    </section>
  );
}
