"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Droplets,
  Loader2,
  Moon,
  Plus,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import { cerrarEpisodio } from "../actions/episodios";
import {
  fechaHoraAhora,
  formatearDuracion,
  formatearFechaHoraCorta,
  minutosEntre,
} from "../lib/fechas";
import type { EpisodioConFactores } from "../queries";
import type { RegistroDiarioSalud } from "../schema";
import { FormularioEpisodio } from "./formulario-episodio";

export function RegistroRapido({
  enCurso,
  ultimo,
  registroHoy,
  ahora,
}: {
  enCurso: EpisodioConFactores | null;
  ultimo: EpisodioConFactores | null;
  registroHoy: RegistroDiarioSalud | null;
  ahora: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const minutosEnCurso = enCurso
    ? minutosEntre(enCurso.inicioEn, fechaHoraAhora())
    : null;

  function cerrarAhora() {
    if (!enCurso) return;

    const fin = fechaHoraAhora();
    startTransition(async () => {
      const resultado = await cerrarEpisodio(enCurso.id, fin);

      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }

      toast.success("Episodio cerrado", {
        description: "Ya podés completar la respuesta al Tetralgin editándolo.",
      });
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-outline-variant/40 bg-card p-5 shadow-elevation-1 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-heading">
            Registro rápido
          </h2>
          <p className="mt-0.5 text-xs text-charcoal">
            Anotá una crisis apenas empieza y completá el resto cuando termine.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setAbierto(true)}
          className="self-start"
        >
          <Plus size={16} />
          Registrar dolor
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Estado de la crisis */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Estado de hoy
            </span>
            <span
              className={
                enCurso
                  ? "inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold text-on-error-container"
                  : "inline-flex items-center gap-1 rounded-full bg-success-container px-2 py-0.5 text-[10px] font-bold text-on-success-container"
              }
            >
              {enCurso ? (
                <>
                  <Clock size={10} /> En curso
                </>
              ) : (
                <>
                  <CheckCircle2 size={10} /> Sin crisis
                </>
              )}
            </span>
          </div>

          {enCurso ? (
            <>
              <p className="mt-2 text-sm font-semibold text-heading">
                Episodio desde el {formatearFechaHoraCorta(enCurso.inicioEn)}
              </p>
              <p className="text-xs text-on-surface-variant">
                EVA {enCurso.intensidad}/10 ·{" "}
                {minutosEnCurso !== null && minutosEnCurso > 0
                  ? formatearDuracion(minutosEnCurso)
                  : "recién empieza"}
              </p>
              <Button
                type="button"
                variant="outlined"
                size="sm"
                onClick={cerrarAhora}
                disabled={pendiente}
                className="mt-3"
              >
                {pendiente ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Cerrar ahora
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-semibold text-heading">
                {ultimo
                  ? `Último episodio: ${formatearFechaHoraCorta(ultimo.inicioEn)}`
                  : "Todavía no registraste crisis"}
              </p>
              <p className="text-xs text-on-surface-variant">
                {ultimo
                  ? `Intensidad ${ultimo.intensidad}/10. Si te duele la cabeza, registralo acá.`
                  : "Cuando aparezca el dolor, registralo para llevar el control."}
              </p>
            </>
          )}
        </div>

        {/* Bienestar del día */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Bienestar de hoy
            </span>
            <span
              className={
                registroHoy
                  ? "inline-flex items-center gap-1 rounded-full bg-success-container px-2 py-0.5 text-[10px] font-bold text-on-success-container"
                  : "inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant"
              }
            >
              {registroHoy ? "Cargado" : "Pendiente"}
            </span>
          </div>

          {registroHoy ? (
            <ul className="mt-2 space-y-1 text-xs text-on-surface-variant">
              {registroHoy.horasSueno !== null && (
                <li className="flex items-center gap-1.5">
                  <Moon size={12} className="text-primary" />
                  {registroHoy.horasSueno} h de sueño
                </li>
              )}
              {registroHoy.vasosAgua !== null && (
                <li className="flex items-center gap-1.5">
                  <Droplets size={12} className="text-primary" />
                  {registroHoy.vasosAgua} vasos de agua
                </li>
              )}
              {registroHoy.horasPantalla !== null && (
                <li className="flex items-center gap-1.5">
                  <Monitor size={12} className="text-primary" />
                  {registroHoy.horasPantalla} h de pantalla
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-on-surface-variant">
              Completá el diario para cruzar hábitos con las crisis.
            </p>
          )}

          <Link
            href="/salud?vista=bienestar"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary transition-opacity hover:opacity-75"
          >
            {registroHoy ? "Editar diario" : "Completar diario"}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <Dialogo
        abierto={abierto}
        onOpenChange={setAbierto}
        titulo="Registrar dolor"
        descripcion="Cargá la intensidad, el inicio y los desencadenantes del episodio."
        className="max-w-3xl"
      >
        {abierto && (
          <FormularioEpisodio
            ahora={ahora}
            onGuardado={() => setAbierto(false)}
            onCancelar={() => setAbierto(false)}
          />
        )}
      </Dialogo>
    </section>
  );
}
