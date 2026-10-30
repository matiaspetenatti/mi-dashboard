"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Droplets,
  Loader2,
  Monitor,
  Moon,
  NotebookPen,
  Save,
  Smile,
  Trash2,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  eliminarRegistroDiario,
  guardarRegistroDiario,
} from "../actions/diario";
import {
  formatearDiaLargo,
} from "../lib/fechas";
import { formatearFecha } from "@/lib/format";
import type { RegistroDiarioSalud } from "../schema";
import { CAMPO, CAMPO_TEXTAREA, Campo, Chip, GrupoChips } from "./campos";

type Valores = Record<string, string>;

const VACIO: Valores = {
  horasSueno: "",
  calidadSueno: "",
  vasosAgua: "",
  nivelEstres: "",
  horasPantalla: "",
  tazasCafeina: "",
  comidasOmitidas: "",
  actividadMin: "",
  animo: "",
  pesoKg: "",
  notas: "",
};

const ESCALA_ANIMO = ["Muy bajo", "Bajo", "Normal", "Bien", "Muy bien"];
const ESCALA_ESTRES = ["Bajo", "Leve", "Medio", "Alto", "Muy alto"];
const ESCALA_SUENO = ["Mala", "Regular", "Buena", "Muy buena", "Excelente"];

function desdeRegistro(registro: RegistroDiarioSalud | undefined): Valores {
  if (!registro) return { ...VACIO };

  const texto = (valor: number | null) =>
    valor === null ? "" : String(valor);

  return {
    horasSueno: texto(registro.horasSueno),
    calidadSueno: texto(registro.calidadSueno),
    vasosAgua: texto(registro.vasosAgua),
    nivelEstres: texto(registro.nivelEstres),
    horasPantalla: texto(registro.horasPantalla),
    tazasCafeina: texto(registro.tazasCafeina),
    comidasOmitidas: texto(registro.comidasOmitidas),
    actividadMin: texto(registro.actividadMin),
    animo: texto(registro.animo),
    pesoKg: texto(registro.pesoKg),
    notas: registro.notas ?? "",
  };
}

function resumenRegistro(registro: RegistroDiarioSalud) {
  const partes: Array<{ icono: typeof Moon; texto: string }> = [];

  if (registro.horasSueno !== null) {
    partes.push({ icono: Moon, texto: `${registro.horasSueno} h sueño` });
  }
  if (registro.vasosAgua !== null) {
    partes.push({ icono: Droplets, texto: `${registro.vasosAgua} vasos` });
  }
  if (registro.horasPantalla !== null) {
    partes.push({
      icono: Monitor,
      texto: `${registro.horasPantalla} h pantalla`,
    });
  }
  if (registro.nivelEstres !== null) {
    partes.push({ icono: Activity, texto: `Estrés ${registro.nivelEstres}/5` });
  }
  if (registro.animo !== null) {
    partes.push({ icono: Smile, texto: `Ánimo ${registro.animo}/5` });
  }
  if (registro.tazasCafeina !== null) {
    partes.push({ icono: Utensils, texto: `${registro.tazasCafeina} café` });
  }

  return partes;
}

export function DiarioBienestar({
  registros,
  hoy,
}: {
  registros: RegistroDiarioSalud[];
  hoy: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const porFecha = useMemo(
    () => new Map(registros.map((registro) => [registro.fecha, registro])),
    [registros],
  );

  const [fecha, setFecha] = useState(hoy);
  const [valores, setValores] = useState<Valores>(() =>
    desdeRegistro(porFecha.get(hoy)),
  );
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const registroActual = porFecha.get(fecha);
  const set = (clave: string, valor: string) =>
    setValores((prev) => ({ ...prev, [clave]: valor }));

  function cambiarFecha(nueva: string) {
    if (!nueva) return;
    setFecha(nueva);
    setValores(desdeRegistro(porFecha.get(nueva)));
    setError(null);
  }

  function guardar() {
    setError(null);

    const formData = new FormData();
    formData.set("fecha", fecha);
    for (const [clave, valor] of Object.entries(valores)) {
      formData.set(clave, valor);
    }

    startTransition(async () => {
      const resultado = await guardarRegistroDiario(formData);

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      toast.success("Diario guardado", {
        description: "Ya suma para las correlaciones de hábitos.",
      });
      router.refresh();
    });
  }

  function eliminar() {
    if (!registroActual) return;
    if (!confirm("¿Eliminar el registro de bienestar de este día?")) return;

    startTransition(async () => {
      const resultado = await eliminarRegistroDiario(registroActual.id);

      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }

      toast.success("Registro eliminado");
      setValores({ ...VACIO });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* Formulario */}
      <section className="rounded-2xl border border-outline-variant/40 bg-card p-5 shadow-elevation-1 sm:p-6 lg:col-span-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-heading">
              <NotebookPen size={17} className="text-primary" />
              Diario de bienestar
            </h2>
            <p className="mt-0.5 text-xs text-charcoal">
              Un registro por día. Sirve para comparar hábitos en días con y sin
              crisis.
            </p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pebble">
              Día
            </span>
            <input
              type="date"
              value={fecha}
              max={hoy}
              onChange={(event) => cambiarFecha(event.target.value)}
              className={`${CAMPO} h-9 w-40 text-xs`}
            />
          </label>
        </div>

        <p className="mt-2 text-[11px] font-medium text-on-surface-variant">
          {formatearDiaLargo(fecha)}
          {registroActual && (
            <span className="ml-2 rounded-full bg-success-container px-2 py-0.5 text-[10px] font-bold text-on-success-container">
              Registro cargado
            </span>
          )}
        </p>

        <form
          className="mt-5 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            guardar();
          }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Campo etiqueta="Horas de sueño">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step={0.5}
                placeholder="8"
                value={valores.horasSueno}
                onChange={(event) => set("horasSueno", event.target.value)}
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Vasos de agua">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={30}
                placeholder="8"
                value={valores.vasosAgua}
                onChange={(event) => set("vasosAgua", event.target.value)}
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Horas de pantalla">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step={0.5}
                placeholder="6"
                value={valores.horasPantalla}
                onChange={(event) => set("horasPantalla", event.target.value)}
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Tazas de café">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={20}
                placeholder="2"
                value={valores.tazasCafeina}
                onChange={(event) => set("tazasCafeina", event.target.value)}
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Comidas omitidas">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                placeholder="0"
                value={valores.comidasOmitidas}
                onChange={(event) => set("comidasOmitidas", event.target.value)}
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Actividad (min)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={1440}
                placeholder="30"
                value={valores.actividadMin}
                onChange={(event) => set("actividadMin", event.target.value)}
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Peso (kg)">
              <input
                type="number"
                inputMode="decimal"
                min={20}
                max={400}
                step={0.1}
                placeholder="70"
                value={valores.pesoKg}
                onChange={(event) => set("pesoKg", event.target.value)}
                className={CAMPO}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Escala
              etiqueta="Calidad del sueño"
              valores={ESCALA_SUENO}
              seleccionado={valores.calidadSueno}
              onSeleccionar={(valor) => set("calidadSueno", valor)}
            />
            <Escala
              etiqueta="Nivel de estrés"
              valores={ESCALA_ESTRES}
              seleccionado={valores.nivelEstres}
              onSeleccionar={(valor) => set("nivelEstres", valor)}
            />
            <Escala
              etiqueta="Estado de ánimo"
              valores={ESCALA_ANIMO}
              seleccionado={valores.animo}
              onSeleccionar={(valor) => set("animo", valor)}
            />
          </div>

          <Campo
            etiqueta="Notas del día"
            ayuda="Opcional: comidas, viajes, medicación o cualquier contexto."
          >
            <textarea
              value={valores.notas}
              onChange={(event) => set("notas", event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Ej. dormí mal, mucho trabajo, salí a cenar..."
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-4">
            {registroActual ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={eliminar}
                disabled={pendiente}
                className="text-error hover:text-error"
              >
                <Trash2 size={14} />
                Eliminar registro
              </Button>
            ) : (
              <span className="text-[11px] text-pebble">
                Se guarda un registro por día.
              </span>
            )}

            <Button type="submit" disabled={pendiente} className="min-w-40">
              {pendiente ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {registroActual ? "Actualizar día" : "Guardar día"}
            </Button>
          </div>
        </form>
      </section>

      {/* Historial */}
      <section className="rounded-2xl border border-outline-variant/40 bg-card p-5 shadow-elevation-1 sm:p-6 lg:col-span-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold tracking-tight text-heading">
            Últimos registros
          </h2>
          <span className="rounded-full bg-surface-container px-2.5 py-1 text-[10px] font-bold text-on-surface-variant">
            {registros.length} días
          </span>
        </div>

        {registros.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/40 px-4 py-10 text-center">
            <NotebookPen size={22} className="text-primary" />
            <p className="text-sm font-semibold text-heading">
              Todavía no hay registros
            </p>
            <p className="max-w-xs text-xs text-on-surface-variant">
              Empezá con el día de hoy: con 7 días ya se pueden ver
              correlaciones.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {registros.slice(0, 14).map((registro) => {
              const partes = resumenRegistro(registro);

              return (
                <li key={registro.id}>
                  <button
                    type="button"
                    onClick={() => cambiarFecha(registro.fecha)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      registro.fecha === fecha
                        ? "border-primary/40 bg-primary-container/30"
                        : "border-outline-variant/50 bg-surface-container-low/40 hover:border-outline hover:bg-surface-container-low"
                    }`}
                  >
                    <p className="text-xs font-bold text-heading">
                      {formatearFecha(registro.fecha, false)}
                      {registro.fecha === hoy && (
                        <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          Hoy
                        </span>
                      )}
                    </p>
                    {partes.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {partes.map((parte) => (
                          <span
                            key={parte.texto}
                            className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant"
                          >
                            <parte.icono size={11} className="text-primary" />
                            {parte.texto}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-pebble">
                        Sin métricas cargadas
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 border-t border-outline-variant/40 pt-3 text-[11px] text-pebble">
          Usá el calendario del formulario para cargar o corregir días
          anteriores.
        </p>
      </section>
    </div>
  );
}

function Escala({
  etiqueta,
  valores,
  seleccionado,
  onSeleccionar,
}: {
  etiqueta: string;
  valores: string[];
  seleccionado: string;
  onSeleccionar: (valor: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
        {etiqueta}
      </span>
      <GrupoChips>
        {valores.map((label, indice) => {
          const valor = String(indice + 1);
          return (
            <Chip
              key={valor}
              activo={seleccionado === valor}
              onClick={() => onSeleccionar(seleccionado === valor ? "" : valor)}
            >
              {indice + 1} · {label}
            </Chip>
          );
        })}
      </GrupoChips>
    </div>
  );
}
