"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Loader2, Pill, Save, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  actualizarEpisodio,
  crearEpisodio,
} from "../actions/episodios";
import {
  ALIVIOS,
  AURA_TIPOS,
  CATEGORIAS_FACTORES,
  FACTORES,
  LATERALIDADES,
  MAX_COMPRIMIDOS_TETRALGIN,
  PATRONES,
  SINTOMAS,
  nivelDolor,
} from "../constantes";
import {
  compararFechaHora,
  fechaHoraAhora,
  formatearDuracion,
  minutosEntre,
  partirEnFechaHora,
  sumarDias,
} from "../lib/fechas";
import type { EpisodioConFactores } from "../queries";
import { CAMPO, CAMPO_TEXTAREA, Campo, Chip, GrupoChips } from "./campos";

type Valores = {
  inicioFecha: string;
  inicioHora: string;
  finFecha: string;
  finHora: string;
  intensidad: number;
  patron: string;
  lateralidad: string;
  aura: boolean;
  auraTipos: string[];
  sintomas: string[];
  factores: string[];
  otro: string;
  tomoTetralgin: boolean;
  dosis: number;
  tetralginFecha: string;
  tetralginHora: string;
  alivio: string;
  notas: string;
};

function valoresDesde(
  episodio: EpisodioConFactores | null | undefined,
  ahora: string,
): Valores {
  if (episodio) {
    const inicio = partirEnFechaHora(episodio.inicioEn);
    const fin = episodio.finEn ? partirEnFechaHora(episodio.finEn) : null;
    const tetralgin = episodio.tetralginEn
      ? partirEnFechaHora(episodio.tetralginEn)
      : null;

    return {
      inicioFecha: inicio.fecha,
      inicioHora: inicio.hora,
      finFecha: fin?.fecha ?? "",
      finHora: fin?.hora ?? "",
      intensidad: episodio.intensidad,
      patron: episodio.patron ?? "",
      lateralidad: episodio.lateralidad ?? "",
      aura: episodio.aura,
      auraTipos: episodio.auraTipos,
      sintomas: episodio.sintomas,
      factores: episodio.factores,
      otro: episodio.otroDesencadenante ?? "",
      tomoTetralgin: episodio.tomoTetralgin,
      dosis: episodio.dosisTetralgin ?? 1,
      tetralginFecha: tetralgin?.fecha ?? inicio.fecha,
      tetralginHora: tetralgin?.hora ?? "",
      alivio: episodio.alivio ?? "",
      notas: episodio.notas ?? "",
    };
  }

  const ahoraPartido = partirEnFechaHora(ahora);

  return {
    inicioFecha: ahoraPartido.fecha,
    inicioHora: ahoraPartido.hora,
    finFecha: "",
    finHora: "",
    intensidad: 5,
    patron: "",
    lateralidad: "",
    aura: false,
    auraTipos: [],
    sintomas: [],
    factores: [],
    otro: "",
    tomoTetralgin: false,
    dosis: 1,
    tetralginFecha: ahoraPartido.fecha,
    tetralginHora: "",
    alivio: "",
    notas: "",
  };
}

export function FormularioEpisodio({
  episodio,
  ahora,
  onGuardado,
  onCancelar,
}: {
  episodio?: EpisodioConFactores | null;
  ahora: string;
  onGuardado?: () => void;
  onCancelar?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [valores, setValores] = useState<Valores>(() =>
    valoresDesde(episodio, ahora),
  );
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const set = <K extends keyof Valores>(clave: K, valor: Valores[K]) => {
    setValores((prev) => ({ ...prev, [clave]: valor }));
  };

  const inicioEn =
    valores.inicioFecha && valores.inicioHora
      ? `${valores.inicioFecha}T${valores.inicioHora}`
      : null;
  const finEn =
    valores.finFecha && valores.finHora
      ? `${valores.finFecha}T${valores.finHora}`
      : null;
  const duracion =
    inicioEn && finEn ? minutosEntre(inicioEn, finEn) : null;
  const enCurso = !valores.finHora;
  const nivel = nivelDolor(valores.intensidad);

  function cambiarInicioFecha(fecha: string) {
    setValores((prev) => ({
      ...prev,
      inicioFecha: fecha,
      tetralginFecha:
        prev.tetralginFecha === prev.inicioFecha ? fecha : prev.tetralginFecha,
      finFecha: prev.finHora
        ? prev.finHora <= prev.inicioHora
          ? sumarDias(fecha, 1)
          : fecha
        : "",
    }));
  }

  function cambiarFinHora(hora: string) {
    setValores((prev) => {
      if (!hora) return { ...prev, finHora: "", finFecha: "" };
      return {
        ...prev,
        finHora: hora,
        finFecha:
          prev.inicioHora && hora <= prev.inicioHora
            ? sumarDias(prev.inicioFecha, 1)
            : prev.inicioFecha,
      };
    });
  }

  function activarCierre() {
    const ahoraActual = fechaHoraAhora();
    const inicio = inicioEn;

    if (inicio && compararFechaHora(ahoraActual, inicio) > 0) {
      const { fecha, hora } = partirEnFechaHora(ahoraActual);
      setValores((prev) => ({ ...prev, finFecha: fecha, finHora: hora }));
      return;
    }

    setValores((prev) => ({
      ...prev,
      finFecha: prev.inicioFecha,
      finHora: "23:59",
    }));
  }

  function alternarLista(
    clave: "auraTipos" | "sintomas" | "factores",
    valor: string,
  ) {
    setValores((prev) => {
      const lista = prev[clave];
      const activo = lista.includes(valor);
      let siguiente = activo
        ? lista.filter((item) => item !== valor)
        : [...lista, valor];

      if (clave === "factores") {
        if (!activo && valor === "sin-trigger") siguiente = ["sin-trigger"];
        if (!activo && valor !== "sin-trigger") {
          siguiente = siguiente.filter((item) => item !== "sin-trigger");
        }
        if (activo && valor === "otro") {
          return { ...prev, factores: siguiente, otro: "" };
        }
      }

      return { ...prev, [clave]: siguiente };
    });
  }

  function guardar() {
    setError(null);

    if (!inicioEn) {
      setError("Completá la fecha y la hora de inicio");
      return;
    }

    if (finEn && duracion !== null && duracion <= 0) {
      setError("La hora de cierre tiene que ser posterior al inicio");
      return;
    }

    if (valores.factores.includes("otro") && !valores.otro.trim()) {
      setError("Contanos cuál fue el desencadenante");
      return;
    }

    const formData = new FormData();
    formData.set("inicioEn", inicioEn);
    formData.set("finEn", finEn ?? "");
    formData.set("intensidad", String(valores.intensidad));
    formData.set("patron", valores.patron);
    formData.set("lateralidad", valores.lateralidad);
    formData.set("aura", String(valores.aura));
    for (const tipo of valores.aura ? valores.auraTipos : []) {
      formData.append("auraTipos", tipo);
    }
    for (const sintoma of valores.sintomas) {
      formData.append("sintomas", sintoma);
    }
    formData.set("tomoTetralgin", String(valores.tomoTetralgin));
    formData.set(
      "dosisTetralgin",
      valores.tomoTetralgin ? String(valores.dosis) : "",
    );
    formData.set(
      "tetralginEn",
      valores.tomoTetralgin && valores.tetralginHora
        ? `${valores.tetralginFecha}T${valores.tetralginHora}`
        : "",
    );
    formData.set("alivio", valores.tomoTetralgin ? valores.alivio : "");
    formData.set("otroDesencadenante", valores.otro.trim());
    formData.set("notas", valores.notas.trim());
    for (const factor of valores.factores) {
      formData.append("factores", factor);
    }

    startTransition(async () => {
      const resultado = episodio
        ? await actualizarEpisodio(episodio.id, formData)
        : await crearEpisodio(formData);

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      toast.success(
        episodio ? "Episodio actualizado" : "Episodio registrado",
        {
          description: episodio
            ? "Los cambios ya están en tu bitácora."
            : "Podés seguir registrando cuando quieras.",
        },
      );

      if (episodio) {
        onGuardado?.();
      } else {
        setValores(valoresDesde(null, fechaHoraAhora()));
        setError(null);
      }

      router.refresh();
    });
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        guardar();
      }}
    >
      {/* ── 1. Intensidad ───────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            1. Intensidad del dolor (EVA)
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold",
              nivel.clase,
            )}
          >
            Nivel {valores.intensidad} · {nivel.label}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, indice) => indice + 1).map(
            (numero) => (
              <button
                key={numero}
                type="button"
                aria-pressed={valores.intensidad === numero}
                onClick={() => set("intensidad", numero)}
                className={cn(
                  "h-10 rounded-xl border text-sm font-bold transition-all duration-200",
                  valores.intensidad === numero
                    ? "border-transparent bg-inverse-surface text-inverse-on-surface shadow-elevation-1"
                    : "border-outline-variant/60 bg-surface-container-lowest text-charcoal hover:border-outline hover:bg-surface-container-low",
                )}
              >
                {numero}
              </button>
            ),
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* ── 2. Patrón y lateralidad ─────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                2. Características del dolor
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Opcional, ayuda a describir el episodio en la consulta.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-charcoal">
                Patrón
              </span>
              <GrupoChips>
                {PATRONES.map((patron) => (
                  <Chip
                    key={patron.valor}
                    activo={valores.patron === patron.valor}
                    onClick={() =>
                      set(
                        "patron",
                        valores.patron === patron.valor ? "" : patron.valor,
                      )
                    }
                  >
                    {patron.label}
                  </Chip>
                ))}
              </GrupoChips>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-charcoal">
                Lateralidad
              </span>
              <GrupoChips>
                {LATERALIDADES.map((lado) => (
                  <Chip
                    key={lado.valor}
                    activo={valores.lateralidad === lado.valor}
                    onClick={() =>
                      set(
                        "lateralidad",
                        valores.lateralidad === lado.valor ? "" : lado.valor,
                      )
                    }
                  >
                    {lado.label}
                  </Chip>
                ))}
              </GrupoChips>
            </div>
          </section>

          {/* ── 3. Aura ─────────────────────────────────────────── */}
          <section className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              3. Aura
            </span>
            <GrupoChips>
              <Chip
                activo={!valores.aura}
                onClick={() => set("aura", false)}
              >
                <Check size={13} /> Sin aura
              </Chip>
              <Chip
                activo={valores.aura}
                onClick={() => set("aura", true)}
              >
                <Sparkles size={13} /> Con aura
              </Chip>
            </GrupoChips>

            {valores.aura && (
              <GrupoChips className="mt-1">
                {AURA_TIPOS.map((tipo) => (
                  <Chip
                    key={tipo.valor}
                    activo={valores.auraTipos.includes(tipo.valor)}
                    onClick={() => alternarLista("auraTipos", tipo.valor)}
                  >
                    {tipo.label}
                  </Chip>
                ))}
              </GrupoChips>
            )}
          </section>

          {/* ── 4. Síntomas ─────────────────────────────────────── */}
          <section className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              4. Síntomas acompañantes
            </span>
            <GrupoChips>
              {SINTOMAS.map((sintoma) => (
                <Chip
                  key={sintoma.valor}
                  activo={valores.sintomas.includes(sintoma.valor)}
                  onClick={() => alternarLista("sintomas", sintoma.valor)}
                >
                  {sintoma.label}
                </Chip>
              ))}
            </GrupoChips>
          </section>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-5">
          {/* ── 5. Tiempos ──────────────────────────────────────── */}
          <section className="rounded-xl border border-outline-variant/50 bg-surface-container-low/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <Clock size={13} /> Inicio y cierre
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold",
                  enCurso
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-high text-charcoal",
                )}
              >
                {enCurso ? "En curso" : formatearDuracion(duracion)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Fecha inicio">
                <input
                  type="date"
                  required
                  value={valores.inicioFecha}
                  onChange={(event) => cambiarInicioFecha(event.target.value)}
                  className={CAMPO}
                />
              </Campo>
              <Campo etiqueta="Hora inicio">
                <input
                  type="time"
                  required
                  value={valores.inicioHora}
                  onChange={(event) => set("inicioHora", event.target.value)}
                  className={CAMPO}
                />
              </Campo>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Chip
                activo={enCurso}
                onClick={() =>
                  setValores((prev) => ({
                    ...prev,
                    finFecha: "",
                    finHora: "",
                  }))
                }
              >
                Sigue en curso
              </Chip>
              <Chip activo={!enCurso} onClick={activarCierre}>
                Ya terminó
              </Chip>
            </div>

            {!enCurso && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Campo etiqueta="Fecha cierre">
                  <input
                    type="date"
                    required
                    min={valores.inicioFecha}
                    value={valores.finFecha}
                    onChange={(event) => set("finFecha", event.target.value)}
                    className={CAMPO}
                  />
                </Campo>
                <Campo etiqueta="Hora cierre">
                  <input
                    type="time"
                    required
                    value={valores.finHora}
                    onChange={(event) => cambiarFinHora(event.target.value)}
                    className={CAMPO}
                  />
                </Campo>
              </div>
            )}

            {duracion !== null && duracion <= 0 && (
              <p className="mt-2 text-[11px] font-medium text-error">
                El cierre tiene que ser posterior al inicio.
              </p>
            )}
          </section>

          {/* ── 6. Tetralgin ────────────────────────────────────── */}
          <section className="flex flex-col gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <Pill size={13} /> Tetralgin
              </span>
              <div className="inline-flex rounded-full border border-outline-variant/50 bg-surface-container-lowest p-0.5">
                <button
                  type="button"
                  onClick={() => set("tomoTetralgin", false)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
                    !valores.tomoTetralgin
                      ? "bg-inverse-surface text-inverse-on-surface"
                      : "text-on-surface-variant",
                  )}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => set("tomoTetralgin", true)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
                    valores.tomoTetralgin
                      ? "bg-inverse-surface text-inverse-on-surface"
                      : "text-on-surface-variant",
                  )}
                >
                  Sí
                </button>
              </div>
            </div>

            {valores.tomoTetralgin ? (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-charcoal">
                    Comprimidos
                  </span>
                  <GrupoChips>
                    {Array.from(
                      { length: MAX_COMPRIMIDOS_TETRALGIN },
                      (_, indice) => indice + 1,
                    ).map((cantidad) => (
                      <Chip
                        key={cantidad}
                        activo={valores.dosis === cantidad}
                        onClick={() => set("dosis", cantidad)}
                      >
                        {cantidad}
                      </Chip>
                    ))}
                  </GrupoChips>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Campo etiqueta="Fecha de toma">
                    <input
                      type="date"
                      value={valores.tetralginFecha}
                      onChange={(event) =>
                        set("tetralginFecha", event.target.value)
                      }
                      className={CAMPO}
                    />
                  </Campo>
                  <Campo etiqueta="Hora de toma">
                    <input
                      type="time"
                      value={valores.tetralginHora}
                      onChange={(event) =>
                        set("tetralginHora", event.target.value)
                      }
                      className={CAMPO}
                    />
                  </Campo>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-charcoal">
                    Respuesta
                  </span>
                  <GrupoChips>
                    {ALIVIOS.map((alivio) => (
                      <Chip
                        key={alivio.valor}
                        activo={valores.alivio === alivio.valor}
                        onClick={() =>
                          set(
                            "alivio",
                            valores.alivio === alivio.valor
                              ? ""
                              : alivio.valor,
                          )
                        }
                      >
                        {alivio.label}
                      </Chip>
                    ))}
                  </GrupoChips>
                </div>
              </>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Marcá “Sí” si tomaste Tetralgin para registrar dosis, hora y
                respuesta.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* ── 7. Desencadenantes ──────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            5. Desencadenantes
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Podés marcar varios. Se usan para el mapa de desencadenantes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CATEGORIAS_FACTORES.map((categoria) => {
            const factores = FACTORES.filter(
              (factor) => factor.categoria === categoria.id,
            );

            return (
              <div
                key={categoria.id}
                className="rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-3"
              >
                <p className="text-xs font-bold text-heading">
                  {categoria.label}
                </p>
                <p className="mb-2 text-[11px] text-pebble">
                  {categoria.descripcion}
                </p>
                <GrupoChips>
                  {factores.map((factor) => (
                    <Chip
                      key={factor.slug}
                      activo={valores.factores.includes(factor.slug)}
                      onClick={() => alternarLista("factores", factor.slug)}
                    >
                      {factor.label}
                    </Chip>
                  ))}
                </GrupoChips>
              </div>
            );
          })}
        </div>

        {valores.factores.includes("otro") && (
          <Campo etiqueta="¿Cuál fue el desencadenante?">
            <input
              value={valores.otro}
              onChange={(event) => set("otro", event.target.value)}
              maxLength={200}
              placeholder="Ej. olor a pintura, viaje largo..."
              className={CAMPO}
            />
          </Campo>
        )}
      </section>

      {/* ── 8. Notas ────────────────────────────────────────────── */}
      <Campo
        etiqueta="Notas del episodio"
        ayuda="Opcional: medicación previa, contexto o indicaciones para la consulta."
      >
        <textarea
          value={valores.notas}
          onChange={(event) => set("notas", event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Ej. empecé con el dolor después de dormir mal..."
          className={CAMPO_TEXTAREA}
        />
      </Campo>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-error/20 bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/40 pt-4">
        {onCancelar && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelar}
            disabled={pendiente}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pendiente} className="min-w-44">
          {pendiente ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {episodio ? "Guardar cambios" : "Guardar episodio"}
        </Button>
      </div>
    </form>
  );
}
