"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Dialogo } from "@/components/ui/dialogo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type {
  EstadoExamen,
  Materia,
  ResultadoExamen,
  TipoExamen,
} from "../schema";
import {
  etiquetasEstadoExamen,
  etiquetasTipoExamen,
} from "../constantes";
import {
  actualizarExamen,
  crearExamen,
  type DatosExamen,
} from "../actions/examenes";
import type { ExamenConContexto } from "../queries";
import { Campo, Input, SelectEstudio, Textarea } from "./campos";

type TipoCalificacion = "sin" | "nota" | ResultadoExamen;

export function DialogoExamen({
  abierto,
  onOpenChange,
  materias,
  hoy,
  examen,
  materiaInicial,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  materias: Materia[];
  hoy: string;
  examen?: ExamenConContexto | null;
  materiaInicial?: number | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [materiaId, setMateriaId] = useState(
    examen?.materiaId ?? materiaInicial ?? materias[0]?.id ?? 0,
  );
  const [tipo, setTipo] = useState<TipoExamen>(examen?.tipo ?? "parcial");
  const [titulo, setTitulo] = useState(examen?.titulo ?? "");
  const [fecha, setFecha] = useState(examen?.fecha ?? hoy);
  const [estado, setEstado] = useState<EstadoExamen>(
    examen?.estado ?? "programado",
  );
  const [nota, setNota] = useState(
    examen?.nota !== null && examen?.nota !== undefined
      ? String(examen.nota)
      : "",
  );
  const [calificacion, setCalificacion] = useState<TipoCalificacion>(
    examen?.nota !== null && examen?.nota !== undefined
      ? "nota"
      : (examen?.resultado ?? "sin"),
  );
  const [observaciones, setObservaciones] = useState(
    examen?.observaciones ?? "",
  );

  function guardar() {
    const notaCargada =
      calificacion === "nota" && nota.trim() ? nota.trim() : null;
    const resultadoCargado: ResultadoExamen | null =
      calificacion === "aprobado" || calificacion === "desaprobado"
        ? calificacion
        : null;
    const estadoFinal: EstadoExamen =
      (notaCargada || resultadoCargado) && estado === "programado"
        ? "rendido"
        : estado;

    const datos: DatosExamen = {
      materiaId,
      tipo,
      titulo: titulo.trim() || null,
      fecha,
      nota: notaCargada,
      resultado: resultadoCargado,
      estado: estadoFinal,
      observaciones: observaciones.trim() || null,
    };

    setError(null);
    startTransition(async () => {
      const resultado = examen
        ? await actualizarExamen(examen.id, datos)
        : await crearExamen(datos);

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      toast.success(examen ? "Examen actualizado" : "Examen agregado");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialogo
      abierto={abierto}
      onOpenChange={(valor) => {
        if (!valor) setError(null);
        onOpenChange(valor);
      }}
      titulo={examen ? "Editar examen" : "Nuevo examen"}
      descripcion="Programá la fecha y después cargá la nota o el resultado cuando lo rindas."
      className="max-w-xl"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          guardar();
        }}
      >
        <Campo etiqueta="Materia">
          <SelectEstudio
            required
            value={materiaId}
            onChange={(event) => setMateriaId(Number(event.target.value))}
          >
            {materias.map((materia) => (
              <option key={materia.id} value={materia.id}>
                {materia.nombre}
              </option>
            ))}
          </SelectEstudio>
        </Campo>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Tipo">
            <SelectEstudio
              value={tipo}
              onChange={(event) => setTipo(event.target.value as TipoExamen)}
            >
              {(Object.keys(etiquetasTipoExamen) as TipoExamen[]).map(
                (valor) => (
                  <option key={valor} value={valor}>
                    {etiquetasTipoExamen[valor]}
                  </option>
                ),
              )}
            </SelectEstudio>
          </Campo>

          <Campo etiqueta="Fecha">
            <Input
              type="date"
              required
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
            />
          </Campo>
        </div>

        <Campo etiqueta="Título">
          <Input
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Primer parcial, TP integrador..."
          />
        </Campo>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Estado">
            <SelectEstudio
              value={estado}
              onChange={(event) => {
                const valor = event.target.value as EstadoExamen;
                setEstado(valor);
                if (valor === "ausente") setCalificacion("sin");
              }}
            >
              {(
                Object.keys(etiquetasEstadoExamen) as EstadoExamen[]
              ).map((valor) => (
                <option key={valor} value={valor}>
                  {etiquetasEstadoExamen[valor]}
                </option>
              ))}
            </SelectEstudio>
          </Campo>

          <Campo
            etiqueta="Calificación"
            ayuda="Elegí nota numérica o un resultado sin nota."
          >
            <SelectEstudio
              value={calificacion}
              onChange={(event) => {
                const valor = event.target.value as TipoCalificacion;
                setCalificacion(valor);
                if (valor !== "sin" && estado === "programado") {
                  setEstado("rendido");
                }
              }}
            >
              <option value="sin">Sin calificar</option>
              <option value="nota">Con nota</option>
              <option value="aprobado">Aprobado</option>
              <option value="desaprobado">Desaprobado</option>
            </SelectEstudio>
          </Campo>
        </div>

        {calificacion === "nota" && (
          <Campo etiqueta="Nota" ayuda="Si cargás una nota, pasa a rendido.">
            <Input
              inputMode="decimal"
              value={nota}
              onChange={(event) => setNota(event.target.value)}
              placeholder="7,5"
            />
          </Campo>
        )}

        <Campo etiqueta="Observaciones">
          <Textarea
            value={observaciones}
            onChange={(event) => setObservaciones(event.target.value)}
            placeholder="Temas, aula, condiciones..."
            className="min-h-20"
          />
        </Campo>

        {error && (
          <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pendiente}>
            {pendiente && <Loader2 className="animate-spin" />}
            {examen ? "Guardar cambios" : "Agregar examen"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
