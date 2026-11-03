"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Flame, Target } from "lucide-react";
import { formatearFecha } from "@/lib/format";
import type { EstadisticasTiempo } from "../queries";
import {
  agruparPorSemanas,
  formatearMinutos,
  nivelMinutos,
  obtenerUltimoAnioDias,
} from "../lib/tiempo";
import { BarraProgreso } from "./barra-progreso";

const META_DEFECTO_MINUTOS = 600; // 10 horas
const STORAGE_META_KEY = "estudio_meta_semanal_minutos";

const NIVELES_COLOR = [
  "bg-surface-container-low",
  "bg-tertiary/25",
  "bg-tertiary/50",
  "bg-tertiary/75",
  "bg-tertiary",
];

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function leerMeta(): number {
  if (typeof window === "undefined") return META_DEFECTO_MINUTOS;
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    const valor = raw ? Number(raw) : NaN;
    return Number.isFinite(valor) && valor > 0
      ? valor
      : META_DEFECTO_MINUTOS;
  } catch {
    return META_DEFECTO_MINUTOS;
  }
}

function guardarMeta(minutos: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_META_KEY, String(minutos));
  } catch {
    // ignore
  }
}

export function PanelTiempoEstudio({
  datos,
  hoy,
}: {
  datos: EstadisticasTiempo;
  hoy: string;
}) {
  const [metaMinutos, setMetaMinutos] = useState<number>(leerMeta);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaHoras, setMetaHoras] = useState("");

  const mapaMinutos = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const dia of datos.porDia) mapa.set(dia.fecha, dia.minutos);
    return mapa;
  }, [datos.porDia]);

  const semanas = useMemo(
    () => agruparPorSemanas(obtenerUltimoAnioDias(hoy)),
    [hoy],
  );

  const topMaterias = datos.porMateria.slice(0, 5);
  const maxMinutosMateria = Math.max(
    1,
    ...topMaterias.map((m) => m.minutos),
  );

  const porcentajeMeta = Math.min(
    100,
    Math.round((datos.minutosSemana / metaMinutos) * 100),
  );

  function abrirEditarMeta() {
    setMetaHoras(String(metaMinutos / 60));
    setEditandoMeta(true);
  }

  function confirmarMeta() {
    const horas = Number(metaHoras.replace(",", "."));
    if (Number.isFinite(horas) && horas > 0) {
      const minutos = Math.round(horas * 60);
      setMetaMinutos(minutos);
      guardarMeta(minutos);
    }
    setEditandoMeta(false);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3.5">
          <span className="grid size-8 place-items-center rounded-full bg-tertiary-container text-on-tertiary-container">
            <Clock3 size={15} />
          </span>
          <p className="mt-2.5 text-2xl font-medium leading-none text-on-surface">
            {formatearMinutos(datos.minutosSemana)}
          </p>
          <p className="mt-1 text-xs font-medium text-on-surface">
            Esta semana
          </p>
          <p className="text-[10px] text-on-surface-variant">
            de trabajo registrado
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3.5">
          <span className="grid size-8 place-items-center rounded-full bg-tertiary-container text-on-tertiary-container">
            <Flame size={15} />
          </span>
          <p className="mt-2.5 text-2xl font-medium leading-none text-on-surface">
            {datos.rachaActual}
          </p>
          <p className="mt-1 text-xs font-medium text-on-surface">
            Días de racha
          </p>
          <p className="text-[10px] text-on-surface-variant">
            récord {datos.rachaMaxima}
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3.5">
          <span className="grid size-8 place-items-center rounded-full bg-tertiary-container text-on-tertiary-container">
            <CalendarDays size={15} />
          </span>
          <p className="mt-2.5 text-2xl font-medium leading-none text-on-surface">
            {formatearMinutos(datos.minutosHoy)}
          </p>
          <p className="mt-1 text-xs font-medium text-on-surface">Hoy</p>
          <p className="text-[10px] text-on-surface-variant">
            {datos.minutosUltimos30 >= 60
              ? `${formatearMinutos(datos.minutosUltimos30)} en 30 días`
              : "sin actividad reciente"}
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3.5">
          <span className="grid size-8 place-items-center rounded-full bg-tertiary-container text-on-tertiary-container">
            <Target size={15} />
          </span>
          <p className="mt-2.5 text-2xl font-medium leading-none text-on-surface">
            {formatearMinutos(metaMinutos)}
          </p>
          <p className="mt-1 text-xs font-medium text-on-surface">
            Meta semanal
          </p>
          <button
            type="button"
            onClick={abrirEditarMeta}
            className="text-[10px] font-medium text-tertiary underline-offset-2 hover:underline"
          >
            Editar meta
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-on-surface">
            Progreso de la meta semanal
          </p>
          <p className="text-[11px] text-on-surface-variant">
            {formatearMinutos(datos.minutosSemana)} de{" "}
            {formatearMinutos(metaMinutos)}
          </p>
        </div>
        <BarraProgreso
          valor={porcentajeMeta}
          color="var(--color-tertiary)"
          className="mt-2 h-2.5"
        />

        {editandoMeta && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={metaHoras}
              onChange={(event) => setMetaHoras(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") confirmarMeta();
              }}
              aria-label="Meta semanal en horas"
              className="h-9 w-24 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary"
            />
            <span className="text-xs text-on-surface-variant">horas</span>
            <button
              type="button"
              onClick={confirmarMeta}
              className="rounded-full bg-tertiary px-3 py-1.5 text-xs font-semibold text-on-tertiary"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditandoMeta(false)}
              className="text-xs text-on-surface-variant hover:text-on-surface"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-on-surface">
            Actividad del último año
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
            <span className="size-2.5 rounded-[3px] bg-surface-container-low" />
            Menos
            {NIVELES_COLOR.slice(1).map((clase) => (
              <span
                key={clase}
                className={`size-2.5 rounded-[3px] ${clase}`}
              />
            ))}
            Más
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-fit">
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 pr-1">
                {DIAS_SEMANA.map((dia, indice) => (
                  <span
                    key={dia}
                    className="flex h-3 w-3 items-center text-[9px] leading-none text-on-surface-variant"
                    aria-hidden={indice % 2 === 0}
                  >
                    {indice % 2 === 0 ? dia : ""}
                  </span>
                ))}
              </div>

              <div className="flex gap-1">
                {semanas.map((semana, si) => (
                  <div key={si} className="flex flex-col gap-1">
                    {semana.map((fecha, di) => {
                      if (fecha === null) {
                        return (
                          <div
                            key={di}
                            className="size-3 rounded-[3px] bg-transparent"
                          />
                        );
                      }
                      const minutos = mapaMinutos.get(fecha) ?? 0;
                      const nivel = nivelMinutos(minutos);
                      return (
                        <div
                          key={di}
                          title={`${formatearFecha(fecha)} · ${formatearMinutos(minutos)}`}
                          className={`size-3 rounded-[3px] ${NIVELES_COLOR[nivel]}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {topMaterias.length > 0 && (
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
          <p className="text-xs font-semibold text-on-surface">
            Materias con más estudio
          </p>
          <ul className="mt-3 space-y-2.5">
            {topMaterias.map((materia) => (
              <li key={materia.materiaId}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-on-surface">
                    {materia.materia}
                    <span className="text-on-surface-variant">
                      {" "}
                      · {materia.carrera}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-on-surface-variant">
                    {formatearMinutos(materia.minutos)}
                  </span>
                </div>
                <BarraProgreso
                  valor={(materia.minutos / maxMinutosMateria) * 100}
                  color="var(--color-tertiary)"
                  className="h-1.5"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
