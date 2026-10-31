"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Activity, Calendar } from "lucide-react";
import { cn } from "cn";
import type { Habito } from "@/modules/habitos/schema";
import {
  getHabitos,
  getRegistrosPorFecha,
  getGithubActividad,
  type GithubActividad,
} from "@/modules/habitos/queries";
import { setRegistroDiario, eliminarHabito } from "@/modules/habitos/actions";
import { HabitCard } from "@/modules/habitos/components/habit-card";
import { HabitForm } from "@/modules/habitos/components/habit-form";
import { HabitDetail } from "@/modules/habitos/components/habit-detail";
import { GithubActivity } from "@/modules/habitos/components/github-activity";
import { Skeleton } from "@/components/ui/skeleton";

const HOY = new Date().toISOString().slice(0, 10);

export function HabitosContenido() {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [registrosHoy, setRegistrosHoy] = useState<Record<number, boolean>>({});
  const [githubActividad, setGithubActividad] = useState<
    Array<{ fecha: string; commits: number; pullRequests: number; issues: number }>
  >([]);
  const [totalCommits, setTotalCommits] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [habitoDetalle, setHabitoDetalle] = useState<Habito | null>(null);
  const [habitoEditando, setHabitoEditando] = useState<Habito | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [hs, rh, ga] = await Promise.all([
        getHabitos(true),
        getRegistrosPorFecha(HOY),
        getGithubActividad(),
      ]);

      setHabitos(hs);

      const hoyMap: Record<number, boolean> = {};
      rh.forEach((r) => {
        hoyMap[r.habitoId] = r.completado;
      });
      setRegistrosHoy(hoyMap);

      setGithubActividad(
        ga.map((g) => ({
          fecha: g.fecha,
          commits: g.commits,
          pullRequests: g.pullRequests,
          issues: g.issues,
        })),
      );
      setTotalCommits(ga.reduce((sum, g) => sum + g.commits, 0));
    } catch {
      // Errores ya se loguean en queries
    } finally {
      setCargando(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const manejarToggle = useCallback(
    async (habitoId: number, siguiente: boolean) => {
      await setRegistroDiario({
        habitoId,
        fecha: HOY,
        completado: siguiente,
      });
      await cargarDatos();
    },
    [cargarDatos],
  );

  const manejarAgregar = () => {
    setHabitoEditando(undefined);
    setHabitoDetalle(null);
    setFormOpen(true);
  };

  const manejarEditar = (h: Habito) => {
    setHabitoEditando(h);
    setHabitoDetalle(null);
    setFormOpen(true);
  };

  const manejarEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este hábito? Se borrará su historial.")) return;
    const res = await eliminarHabito(id);
    if (res.ok) {
      await cargarDatos();
    } else {
      alert(res.error);
    }
  };

  const habitosBuenos = habitos.filter((h) => h.tipo === "bueno");
  const habitosMalos = habitos.filter((h) => h.tipo === "malo");

  const rachaMasLarga = Math.max(
    0,
    ...habitos.map(() => 0), // placeholder; las rachas se calculan por hábito
  );

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
              Hábitos
            </p>
            <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
              Hábitos
            </h1>
          </div>
          <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary pulse">
            Cargando…
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-[20px]" />
          ))}
        </div>
        <Skeleton className="h-[200px] w-full rounded-[20px]" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
            Hábitos
          </p>
          <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
            Hábitos
          </h1>
          <p className="mt-1 max-w-xl text-sm text-charcoal">
            Trackeá tus hábitos diarios, llevá rachas y sincronizá tu
            actividad de GitHub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={manejarAgregar}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90"
          >
            <Plus size={14} />
            Nuevo hábito
          </button>
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="inline-flex items-center gap-1 rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-surface-container disabled:opacity-50"
          >
            {cargando ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
          </button>
        </div>
      </header>

      {/* Resumen rápido */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[20px] border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
          <p className="text-[10px] uppercase tracking-wider text-pebble">Hábitos activos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-charcoal">
            {habitos.length}
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            {habitosBuenos.length} buenos • {habitosMalos.length} a erradicar
          </p>
        </div>
        <div className="rounded-[20px] border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
          <p className="text-[10px] uppercase tracking-wider text-pebble">Completados hoy</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-charcoal">
            {Object.values(registrosHoy).filter(Boolean).length}
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            de {habitos.length} hábito{habitos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-[20px] border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
          <p className="text-[10px] uppercase tracking-wider text-pebble">Commits GitHub</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-charcoal">
            {totalCommits}
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            Últimos 30 días
          </p>
        </div>
        <div className="rounded-[20px] border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
          <p className="text-[10px] uppercase tracking-wider text-pebble">Racha actual</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-charcoal">
            0
          </p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            Días consecutivos
          </p>
        </div>
      </div>

      {/* Lista de hábitos con heatmaps mini */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-pebble">
            Mis hábitos
          </h2>
        </div>

        {habitos.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-outline-variant/70 bg-surface-bright p-12 text-center">
            <Plus size={24} className="mx-auto text-primary mb-2" />
            <h3 className="text-sm font-semibold text-charcoal">
              Sin hábitos todavía
            </h3>
            <p className="text-xs text-on-surface-variant">
              Creá tu primer hábito para comenzar a trackear tu progreso.
            </p>
            <button
              onClick={manejarAgregar}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90"
            >
              <Plus size={14} />
              Agregar hábito
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {habitos.map((h) => {
              const completadoHoy = Boolean(registrosHoy[h.id]);
              // Buscar registros de este hábito para el heatmap
              // Por ahora pasamos vacío; el detalle muestra el heatmap completo
              return (
                <HabitCard
                  key={h.id}
                  habito={h}
                  registros={[]}
                  rachaActual={0}
                  rachaMaxima={0}
                  completadoHoy={completadoHoy}
                  onToggle={(siguiente) =>
                    manejarToggle(h.id, siguiente)
                  }
                  onEditar={manejarEditar}
                  onEliminar={manejarEliminar}
                  onVerDetalle={(hab) => setHabitoDetalle(hab)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Actividad GitHub */}
      <section>
        <GithubActivity
          dias={githubActividad}
          totalCommits={totalCommits}
        />
      </section>

      {/* Modal: formulario */}
      <HabitForm
        open={formOpen}
        habito={habitoEditando}
        onClose={() => {
          setHabitoEditando(undefined);
          setFormOpen(false);
        }}
        onGuardado={cargarDatos}
      />

      {/* Modal: detalle de hábito */}
      {habitoDetalle && (
        <HabitDetail
          habito={habitoDetalle}
          registros={[]}
          onClose={() => setHabitoDetalle(null)}
          onToggle={async (siguiente) => {
            if (habitoDetalle) {
              await manejarToggle(habitoDetalle.id, siguiente);
              setHabitoDetalle(null);
            }
          }}
          onEditar={(h) => {
            setHabitoEditando(h);
            setHabitoDetalle(null);
            setFormOpen(true);
          }}
          onEliminar={manejarEliminar}
        />
      )}
    </div>
  );
}
