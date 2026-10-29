"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Pause,
  Play,
  RefreshCw,
  Settings2,
  SkipForward,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { Campo, Input, SelectEstudio } from "./campos";
import { obtenerMateriasPorCarrera } from "../actions/materias";
import { registrarSesionEstudio } from "../actions/sesiones";
import { cn } from "cn";

type Fase = "inactivo" | "trabajo" | "descanso_corto" | "descanso_largo";

interface ConfigPomodoro {
  trabajoMinutos: number;
  descansoCortoMinutos: number;
  descansoLargoMinutos: number;
  ciclosHastaLargo: number;
}

const CONFIG_DEFECTO: ConfigPomodoro = {
  trabajoMinutos: 25,
  descansoCortoMinutos: 5,
  descansoLargoMinutos: 15,
  ciclosHastaLargo: 4,
};

const STORAGE_CONFIG_KEY = "estudio_pomodoro_config";
const STORAGE_SELECCION_KEY = "estudio_pomodoro_seleccion";

function leerConfig(): ConfigPomodoro {
  if (typeof window === "undefined") return CONFIG_DEFECTO;
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (!raw) return CONFIG_DEFECTO;
    return { ...CONFIG_DEFECTO, ...JSON.parse(raw) };
  } catch {
    return CONFIG_DEFECTO;
  }
}

function escribirConfig(config: ConfigPomodoro) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

function leerSeleccion() {
  if (typeof window === "undefined") {
    return { carreraId: null as number | null, materiaId: null as number | null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_SELECCION_KEY);
    if (!raw) return { carreraId: null, materiaId: null };
    const parsed = JSON.parse(raw);
    return {
      carreraId: parsed.carreraId ?? null,
      materiaId: parsed.materiaId ?? null,
    };
  } catch {
    return { carreraId: null, materiaId: null };
  }
}

function escribirSeleccion(carreraId: number | null, materiaId: number | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_SELECCION_KEY,
      JSON.stringify({ carreraId, materiaId }),
    );
  } catch {
    // ignore
  }
}

function formatearTiempo(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function textoFase(fase: Fase) {
  if (fase === "trabajo") return "Trabajo";
  if (fase === "descanso_corto") return "Descanso corto";
  if (fase === "descanso_largo") return "Descanso largo";
  return "Inactivo";
}

function hacerBep() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    ctx.close();
  } catch {
    // audio no disponible o bloqueado
  }
}

export function PomodoroTimer({
  carreras: carrerasProps = [],
}: {
  carreras?: { id: number; nombre: string }[];
} = {}) {
  const toast = useToast();
  const [config, setConfig] = useState<ConfigPomodoro>(leerConfig);
  const seleccionInicial = leerSeleccion();

  const [carreras, setCarreras] = useState<{ id: number; nombre: string }[]>(
    carrerasProps,
  );
  const [materias, setMaterias] = useState<{ id: number; nombre: string }[]>([]);
  const [cargandoMaterias, setCargandoMaterias] = useState(false);

  const [carreraId, setCarreraId] = useState<number | null>(
    seleccionInicial.carreraId,
  );
  const [materiaId, setMateriaId] = useState<number | null>(
    seleccionInicial.materiaId,
  );

  const [fase, setFase] = useState<Fase>("inactivo");
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [ciclosCompletados, setCiclosCompletados] = useState(0);
  const [abiertoConfig, setAbiertoConfig] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finFaseRef = useRef<(() => void) | null>(null);
  const faseRef = useRef<Fase>(fase);

  const duracionFase = useCallback((f: Fase) => {
    if (f === "trabajo") return config.trabajoMinutos * 60;
    if (f === "descanso_corto") return config.descansoCortoMinutos * 60;
    if (f === "descanso_largo") return config.descansoLargoMinutos * 60;
    return 0;
  }, [config]);

  const manejarFinFase = useCallback(() => {
    hacerBep();
    if (fase === "trabajo") {
      setCiclosCompletados((c) => c + 1);
      const esLargo = ciclosCompletados + 1 >= config.ciclosHastaLargo;
      const nuevaFase: Fase = esLargo ? "descanso_largo" : "descanso_corto";
      setFase(nuevaFase);
      setSegundosRestantes(duracionFase(nuevaFase));
      toast.success(
        esLargo
          ? "¡Trabajo completado! Descanso largo"
          : "¡Trabajo completado! Descanso corto",
      );
      if (carreraId && materiaId) {
        registrarSesionEstudio({
          carreraId,
          materiaId,
          tipo: "trabajo",
          duracionMinutos: config.trabajoMinutos,
          fecha: new Date().toISOString().slice(0, 10),
        }).catch(() => {});
      }
    } else {
      const tipoSesion: "descanso_corto" | "descanso_largo" =
        fase === "descanso_largo" ? "descanso_largo" : "descanso_corto";
      const duracion =
        fase === "descanso_largo"
          ? config.descansoLargoMinutos
          : config.descansoCortoMinutos;
      setFase("trabajo");
      setSegundosRestantes(duracionFase("trabajo"));
      toast.success("¡Descanso terminado! A trabajar");
      if (carreraId && materiaId) {
        registrarSesionEstudio({
          carreraId,
          materiaId,
          tipo: tipoSesion,
          duracionMinutos: duracion,
          fecha: new Date().toISOString().slice(0, 10),
        }).catch(() => {});
      }
    }
  }, [
    fase,
    ciclosCompletados,
    config,
    carreraId,
    materiaId,
    toast,
    duracionFase,
  ]);

  useEffect(() => {
    faseRef.current = fase;
    finFaseRef.current = manejarFinFase;
  }, [fase, manejarFinFase]);

  // Cargar carreras (solo si no se pasaron como prop)
  useEffect(() => {
    if (carrerasProps.length > 0) return;
    let montado = true;
    (async () => {
      try {
        const { getEstudioData } = await import("../queries");
        const data = await getEstudioData();
        if (montado) {
          setCarreras(
            data.carreras.map((c) => ({
              id: c.carrera.id,
              nombre: c.carrera.nombre,
            })),
          );
        }
      } catch {
        // ignore en cliente
      }
    })();
    return () => {
      montado = false;
    };
  }, [carrerasProps]);

  // Cargar materias al cambiar carrera (y resetear cuando no hay carrera)
  useEffect(() => {
    let montado = true;
    (async () => {
      if (!carreraId) {
        if (montado) {
          setMaterias([]);
          setMateriaId(null);
          setCargandoMaterias(false);
        }
        return;
      }
      setCargandoMaterias(true);
      try {
        const lista = await obtenerMateriasPorCarrera(carreraId);
        if (montado) {
          setMaterias(lista.map((m) => ({ id: m.id, nombre: m.nombre })));
          if (materiaId && !lista.some((m) => m.id === materiaId)) {
            setMateriaId(null);
          }
          setCargandoMaterias(false);
        }
      } catch {
        if (montado) setCargandoMaterias(false);
      }
    })();
    return () => {
      montado = false;
    };
  }, [carreraId, materiaId]);

  // Persistir selección
  useEffect(() => {
    escribirSeleccion(carreraId, materiaId);
  }, [carreraId, materiaId]);

  // Persistir config
  useEffect(() => {
    escribirConfig(config);
  }, [config]);

  // Temporizador
  useEffect(() => {
    if (fase === "inactivo") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    const id = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          finFaseRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    intervalRef.current = id;
    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [fase]);

  function iniciar() {
    if (!carreraId || !materiaId) {
      toast.error("Seleccioná una carrera y una materia primero");
      return;
    }
    if (fase === "inactivo") {
      setFase("trabajo");
      setSegundosRestantes(duracionFase("trabajo"));
      setCiclosCompletados(0);
    } else if (segundosRestantes === 0) {
      setSegundosRestantes(duracionFase(fase));
    }
  }

  function pausar() {
    setFase("inactivo");
  }

  function reiniciar() {
    setFase("inactivo");
    setSegundosRestantes(0);
    setCiclosCompletados(0);
  }

  function saltar() {
    setSegundosRestantes(0);
  }

  const activo = fase !== "inactivo";
  const segundosTotales = duracionFase(fase);
  const progreso =
    segundosTotales > 0
      ? Math.round(((segundosTotales - segundosRestantes) / segundosTotales) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
        <div className="flex items-center gap-2 mb-4">
          <Timer size={18} />
          <h3 className="text-sm font-semibold text-on-surface">Pomodoro</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Carrera">
            <SelectEstudio
              value={carreraId ?? ""}
              onChange={(e) => setCarreraId(Number(e.target.value))}
              disabled={false}
            >
              <option value="">Seleccioná carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre}
                </option>
              ))}
            </SelectEstudio>
          </Campo>
          <Campo etiqueta="Materia">
            <SelectEstudio
              value={materiaId ?? ""}
              onChange={(e) => setMateriaId(Number(e.target.value))}
              disabled={!carreraId || cargandoMaterias}
            >
              <option value="">Seleccioná materia</option>
              {materias.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.nombre}
                </option>
              ))}
              {carreraId && !cargandoMaterias && materias.length === 0 && (
                <option disabled>Sin materias en esta carrera</option>
              )}
            </SelectEstudio>
          </Campo>
        </div>
        {(cargandoMaterias) && (
          <p className="mt-2 text-[11px] text-on-surface-variant">
            Cargando...
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium",
              fase === "trabajo"
                ? "bg-success-container text-on-success-container"
                : fase === "descanso_corto" || fase === "descanso_largo"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-outline text-on-outline",
            )}
          >
            {textoFase(fase)}
          </span>
          {ciclosCompletados > 0 && (
            <span className="text-[11px] text-on-surface-variant">
              Ciclo {ciclosCompletados} de {config.ciclosHastaLargo}
            </span>
          )}
        </div>
        <div className="text-5xl font-mono font-medium text-on-surface mb-2">
          {formatearTiempo(segundosRestantes)}
        </div>
        <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-tertiary transition-all duration-1000 ease-out"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          {activo ? (
            <Button variant="destructive" size="sm" onClick={pausar}>
              <Pause size={16} />
              Pausar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={iniciar}
              disabled={!carreraId || !materiaId}
            >
              {segundosRestantes > 0 ? <Play size={16} /> : null}
              {segundosRestantes > 0 ? "Continuar" : "Iniciar"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={saltar}>
            <SkipForward size={16} />
            Saltar
          </Button>
          <Button variant="ghost" size="sm" onClick={reiniciar}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="outlined" size="sm" onClick={() => setAbiertoConfig(true)}>
            <Settings2 size={16} />
          </Button>
        </div>
      </div>

      <Dialogo
        abierto={abiertoConfig}
        onOpenChange={setAbiertoConfig}
        titulo="Configuración Pomodoro"
        descripcion="Ajustá los minutos de cada etapa y cuántos ciclos antes del descanso largo."
        className="max-w-md"
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Campo etiqueta="Trabajo (minutos)" ayuda="25 por defecto">
            <Input
              type="number"
              min={1}
              max={480}
              value={config.trabajoMinutos}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v > 0) {
                  setConfig((c) => ({ ...c, trabajoMinutos: v }));
                }
              }}
            />
          </Campo>
          <Campo etiqueta="Descanso corto (minutos)" ayuda="5 por defecto">
            <Input
              type="number"
              min={1}
              max={480}
              value={config.descansoCortoMinutos}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v > 0) {
                  setConfig((c) => ({ ...c, descansoCortoMinutos: v }));
                }
              }}
            />
          </Campo>
          <Campo etiqueta="Descanso largo (minutos)" ayuda="15 por defecto">
            <Input
              type="number"
              min={1}
              max={480}
              value={config.descansoLargoMinutos}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v > 0) {
                  setConfig((c) => ({ ...c, descansoLargoMinutos: v }));
                }
              }}
            />
          </Campo>
          <Campo etiqueta="Ciclos hasta descanso largo" ayuda="4 por defecto">
            <Input
              type="number"
              min={1}
              max={20}
              value={config.ciclosHastaLargo}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v > 0) {
                  setConfig((c) => ({ ...c, ciclosHastaLargo: v }));
                }
              }}
            />
          </Campo>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAbiertoConfig(false)}
            >
              Cerrar
            </Button>
          </div>
        </form>
      </Dialogo>
    </div>
  );
}
