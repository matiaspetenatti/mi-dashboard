"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Dialogo } from "@/components/ui/dialogo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type {
  Cuatrimestre,
  EstadoMateria,
  Materia,
} from "../schema";
import {
  aniosMateria,
  etiquetasCuatrimestre,
  etiquetasEstadoMateria,
} from "../constantes";
import {
  actualizarMateria,
  crearMateria,
  type DatosMateria,
} from "../actions/materias";
import { Campo, Input, SelectEstudio, Textarea } from "./campos";

function aNumero(valor: string) {
  return valor.trim() === "" ? null : Number(valor);
}

export function DialogoMateria({
  abierto,
  onOpenChange,
  carreraId,
  materia,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  carreraId: number;
  materia?: Materia | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState(materia?.nombre ?? "");
  const [anio, setAnio] = useState(
    materia?.anio ? String(materia.anio) : "",
  );
  const [cuatrimestre, setCuatrimestre] = useState<Cuatrimestre | "">(
    materia?.cuatrimestre ?? "",
  );
  const [creditos, setCreditos] = useState(
    materia?.creditos ? String(materia.creditos) : "",
  );
  const [estado, setEstado] = useState<EstadoMateria>(
    materia?.estado ?? "pendiente",
  );
  const [notaFinal, setNotaFinal] = useState(
    materia?.notaFinal !== null && materia?.notaFinal !== undefined
      ? String(materia.notaFinal)
      : "",
  );
  const [profesor, setProfesor] = useState(materia?.profesor ?? "");
  const [notas, setNotas] = useState(materia?.notas ?? "");

  function guardar() {
    const datos: DatosMateria = {
      carreraId,
      nombre: nombre.trim(),
      anio: aNumero(anio),
      cuatrimestre: cuatrimestre || null,
      creditos: aNumero(creditos),
      estado,
      notaFinal: notaFinal.trim() || null,
      profesor: profesor.trim() || null,
      notas: notas.trim() || null,
    };

    setError(null);
    startTransition(async () => {
      const resultado = materia
        ? await actualizarMateria(materia.id, datos)
        : await crearMateria(datos);

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      toast.success(materia ? "Materia actualizada" : "Materia agregada");
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
      titulo={materia ? "Editar materia" : "Nueva materia"}
      descripcion="Cargá la materia, su estado y la nota final si ya la aprobaste."
      className="max-w-xl"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          guardar();
        }}
      >
        <Campo etiqueta="Nombre">
          <Input
            autoFocus
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Análisis Matemático I"
          />
        </Campo>

        <div className="grid gap-3 sm:grid-cols-3">
          <Campo etiqueta="Año">
            <SelectEstudio
              value={anio}
              onChange={(event) => setAnio(event.target.value)}
            >
              <option value="">Sin año</option>
              {aniosMateria.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}° año
                </option>
              ))}
            </SelectEstudio>
          </Campo>

          <Campo etiqueta="Cuatrimestre">
            <SelectEstudio
              value={cuatrimestre}
              onChange={(event) =>
                setCuatrimestre(event.target.value as Cuatrimestre | "")
              }
            >
              <option value="">Sin definir</option>
              {(
                Object.keys(etiquetasCuatrimestre) as Cuatrimestre[]
              ).map((valor) => (
                <option key={valor} value={valor}>
                  {etiquetasCuatrimestre[valor]}
                </option>
              ))}
            </SelectEstudio>
          </Campo>

          <Campo etiqueta="Créditos">
            <Input
              inputMode="numeric"
              value={creditos}
              onChange={(event) => setCreditos(event.target.value)}
              placeholder="Opcional"
            />
          </Campo>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Estado">
            <SelectEstudio
              value={estado}
              onChange={(event) =>
                setEstado(event.target.value as EstadoMateria)
              }
            >
              {(
                Object.keys(etiquetasEstadoMateria) as EstadoMateria[]
              ).map((valor) => (
                <option key={valor} value={valor}>
                  {etiquetasEstadoMateria[valor]}
                </option>
              ))}
            </SelectEstudio>
          </Campo>

          <Campo etiqueta="Nota final" ayuda="Opcional, de 0 a 10.">
            <Input
              inputMode="decimal"
              value={notaFinal}
              onChange={(event) => setNotaFinal(event.target.value)}
              placeholder="8,5"
            />
          </Campo>
        </div>

        <Campo etiqueta="Profesor">
          <Input
            value={profesor}
            onChange={(event) => setProfesor(event.target.value)}
            placeholder="Opcional"
          />
        </Campo>

        <Campo etiqueta="Notas">
          <Textarea
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            placeholder="Observaciones, programa, material..."
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
            {materia ? "Guardar cambios" : "Agregar materia"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
