"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "cn";
import { Dialogo } from "@/components/ui/dialogo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Carrera, EstadoCarrera } from "../schema";
import {
  colorCarreraPorDefecto,
  etiquetasEstadoCarrera,
  paletaCarreras,
} from "../constantes";
import {
  actualizarCarrera,
  crearCarrera,
  type DatosCarrera,
} from "../actions/carreras";
import { Campo, Input, SelectEstudio, Textarea } from "./campos";

function aNumero(valor: string) {
  return valor.trim() === "" ? null : Number(valor);
}

export function DialogoCarrera({
  abierto,
  onOpenChange,
  carrera,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  carrera?: Carrera | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState(carrera?.nombre ?? "");
  const [institucion, setInstitucion] = useState(carrera?.institucion ?? "");
  const [estado, setEstado] = useState<EstadoCarrera>(
    carrera?.estado ?? "cursando",
  );
  const [anioInicio, setAnioInicio] = useState(
    carrera?.anioInicio ? String(carrera.anioInicio) : "",
  );
  const [anioFin, setAnioFin] = useState(
    carrera?.anioFin ? String(carrera.anioFin) : "",
  );
  const [materiasTotales, setMateriasTotales] = useState(
    carrera?.materiasTotales ? String(carrera.materiasTotales) : "",
  );
  const [color, setColor] = useState<string>(
    carrera?.color ?? colorCarreraPorDefecto,
  );
  const [notas, setNotas] = useState(carrera?.notas ?? "");

  function guardar() {
    const datos: DatosCarrera = {
      nombre: nombre.trim(),
      institucion: institucion.trim() || null,
      estado,
      anioInicio: aNumero(anioInicio),
      anioFin: aNumero(anioFin),
      materiasTotales: aNumero(materiasTotales),
      color,
      notas: notas.trim() || null,
    };

    setError(null);
    startTransition(async () => {
      if (carrera) {
        const resultado = await actualizarCarrera(carrera.id, datos);
        if (!resultado.ok) {
          setError(resultado.error);
          return;
        }
        toast.success("Carrera actualizada");
        onOpenChange(false);
        router.refresh();
        return;
      }

      const resultado = await crearCarrera(datos);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      toast.success("Carrera creada");
      onOpenChange(false);
      router.push(`/estudio/carreras/${resultado.id}`);
    });
  }

  return (
    <Dialogo
      abierto={abierto}
      onOpenChange={(valor) => {
        if (!valor) setError(null);
        onOpenChange(valor);
      }}
      titulo={carrera ? "Editar carrera" : "Nueva carrera"}
      descripcion={
        carrera
          ? "Actualizá los datos generales de tu carrera."
          : "Cargá el nombre y, si querés, el total de materias del plan."
      }
      className="max-w-xl"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          guardar();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Nombre" className="sm:col-span-2">
            <Input
              autoFocus
              required
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Licenciatura en Sistemas"
            />
          </Campo>

          <Campo etiqueta="Institución">
            <Input
              value={institucion}
              onChange={(event) => setInstitucion(event.target.value)}
              placeholder="Universidad Nacional..."
            />
          </Campo>

          <Campo etiqueta="Estado">
            <SelectEstudio
              value={estado}
              onChange={(event) =>
                setEstado(event.target.value as EstadoCarrera)
              }
            >
              {(
                Object.keys(etiquetasEstadoCarrera) as EstadoCarrera[]
              ).map((valor) => (
                <option key={valor} value={valor}>
                  {etiquetasEstadoCarrera[valor]}
                </option>
              ))}
            </SelectEstudio>
          </Campo>

          <Campo etiqueta="Año de inicio">
            <Input
              inputMode="numeric"
              value={anioInicio}
              onChange={(event) => setAnioInicio(event.target.value)}
              placeholder="2024"
            />
          </Campo>

          <Campo etiqueta="Año de fin estimado">
            <Input
              inputMode="numeric"
              value={anioFin}
              onChange={(event) => setAnioFin(event.target.value)}
              placeholder="2029"
            />
          </Campo>

          <Campo
            etiqueta="Materias del plan"
            ayuda="Opcional. Si lo completás, el progreso se calcula sobre este total."
            className="sm:col-span-2"
          >
            <Input
              inputMode="numeric"
              value={materiasTotales}
              onChange={(event) => setMateriasTotales(event.target.value)}
              placeholder="40"
            />
          </Campo>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-on-surface-variant">Color</p>
          <div className="flex flex-wrap gap-2">
            {paletaCarreras.map((valor) => (
              <button
                key={valor}
                type="button"
                aria-label={`Elegir color ${valor}`}
                aria-pressed={color === valor}
                onClick={() => setColor(valor)}
                className={cn(
                  "size-8 rounded-full border-2 transition-transform",
                  color === valor
                    ? "scale-110 border-on-surface"
                    : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: valor }}
              />
            ))}
          </div>
        </div>

        <Campo etiqueta="Notas">
          <Textarea
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            placeholder="Información útil de la carrera (opcional)"
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
            {carrera ? "Guardar cambios" : "Crear carrera"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
