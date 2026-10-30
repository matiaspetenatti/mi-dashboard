"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import { actualizarReceta, guardarReceta } from "../actions/recetas";
import {
  TIPOS_RECETA,
  TONOS,
  UNIDADES,
  etiquetaTipoReceta,
} from "../constantes";
import type {
  IngredienteReceta,
  RecetaComida,
  TipoReceta,
  TonoReceta,
} from "../schema";
import {
  CAMPO,
  CAMPO_SELECT,
  CAMPO_TEXTAREA,
  Campo,
  Etiqueta,
} from "./campos";

type FilaIngrediente = {
  nombre: string;
  cantidad: string;
  unidad: string;
  opcional: boolean;
};

function filaDesdeIngrediente(ingrediente: IngredienteReceta): FilaIngrediente {
  return {
    nombre: ingrediente.nombre,
    cantidad:
      ingrediente.cantidad === null ? "" : String(ingrediente.cantidad),
    unidad: ingrediente.unidad,
    opcional: ingrediente.opcional,
  };
}

const FILA_VACIA: FilaIngrediente = {
  nombre: "",
  cantidad: "",
  unidad: "unidad",
  opcional: false,
};

export function FormularioReceta({
  abierto,
  onOpenChange,
  receta,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  receta?: RecetaComida | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();

  const [titulo, setTitulo] = useState(receta?.titulo ?? "");
  const [tipo, setTipo] = useState<TipoReceta>(receta?.tipo ?? "cena");
  const [tono, setTono] = useState<TonoReceta>(receta?.tono ?? "sencillo");
  const [minutos, setMinutos] = useState(String(receta?.minutos ?? 30));
  const [porciones, setPorciones] = useState(String(receta?.porciones ?? 2));
  const [tips, setTips] = useState(receta?.tips ?? "");
  const [vaso, setVaso] = useState(receta?.vaso ?? "");
  const [tecnica, setTecnica] = useState(receta?.tecnica ?? "");
  const [herramientas, setHerramientas] = useState(
    (receta?.herramientas ?? []).join(", "),
  );
  const [filas, setFilas] = useState<FilaIngrediente[]>(
    receta && receta.ingredientes.length > 0
      ? receta.ingredientes.map(filaDesdeIngrediente)
      : [{ ...FILA_VACIA }],
  );
  const [pasos, setPasos] = useState<string[]>(
    receta && receta.pasos.length > 0 ? receta.pasos : [""],
  );

  const esTrago = tipo === "trago";

  function actualizarFila(indice: number, cambios: Partial<FilaIngrediente>) {
    setFilas((actual) =>
      actual.map((fila, posicion) =>
        posicion === indice ? { ...fila, ...cambios } : fila,
      ),
    );
  }

  function actualizarPaso(indice: number, valor: string) {
    setPasos((actual) =>
      actual.map((paso, posicion) => (posicion === indice ? valor : paso)),
    );
  }

  function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const ingredientes: IngredienteReceta[] = filas
      .filter((fila) => fila.nombre.trim().length > 0)
      .map((fila) => {
        const cantidad = fila.cantidad.trim()
          ? Number(fila.cantidad.replace(",", "."))
          : null;
        return {
          nombre: fila.nombre.trim(),
          cantidad: Number.isFinite(cantidad) ? cantidad : null,
          unidad: fila.unidad,
          detalle: null,
          opcional: fila.opcional,
          ingredienteId: null,
        };
      });

    const entrada = {
      titulo: titulo.trim(),
      tipo,
      tono,
      minutos: Number(minutos) || 30,
      porciones: Number(porciones) || 2,
      ingredientes,
      pasos: pasos.map((paso) => paso.trim()).filter(Boolean),
      tips: tips.trim() || null,
      nutricion: receta?.nutricion ?? null,
      herramientas: esTrago
        ? herramientas
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      vaso: esTrago ? vaso.trim() || null : null,
      tecnica: esTrago ? tecnica.trim() || null : null,
      origen: receta?.origen ?? "manual",
    };

    iniciar(async () => {
      const resultado = receta
        ? await actualizarReceta(receta.id, entrada)
        : await guardarReceta(entrada);

      if (resultado.ok) {
        toast.success(receta ? "Receta actualizada" : "Receta creada", {
          description: "Ya está disponible en el recetario.",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  return (
    <Dialogo
      abierto={abierto}
      onOpenChange={onOpenChange}
      titulo={receta ? "Editar receta" : "Nueva receta"}
      descripcion="Cargala a mano con tus cantidades. Después podés cocinarla y descontar el stock."
      className="max-w-2xl"
    >
      <form onSubmit={guardar} className="space-y-4">
        <Campo etiqueta="Título">
          <input
            value={titulo}
            onChange={(evento) => setTitulo(evento.currentTarget.value)}
            required
            maxLength={160}
            placeholder="Ej. Milanesas de pollo con puré"
            className={CAMPO}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Campo etiqueta="Tipo">
            <select
              value={tipo}
              onChange={(evento) => setTipo(evento.currentTarget.value as TipoReceta)}
              className={CAMPO_SELECT}
            >
              {TIPOS_RECETA.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {etiquetaTipoReceta(opcion.valor)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Tono">
            <select
              value={tono}
              onChange={(evento) => setTono(evento.currentTarget.value as TonoReceta)}
              className={CAMPO_SELECT}
            >
              {TONOS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Minutos">
            <input
              value={minutos}
              onChange={(evento) => setMinutos(evento.currentTarget.value)}
              type="number"
              min="1"
              max="600"
              required
              className={CAMPO}
            />
          </Campo>
          <Campo etiqueta={esTrago ? "Tragos" : "Porciones"}>
            <input
              value={esTrago ? "1" : porciones}
              onChange={(evento) => setPorciones(evento.currentTarget.value)}
              type="number"
              min="1"
              max="24"
              disabled={esTrago}
              className={CAMPO}
            />
          </Campo>
        </div>

        {esTrago && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo etiqueta="Vaso">
              <input
                value={vaso}
                onChange={(evento) => setVaso(evento.currentTarget.value)}
                placeholder="Old fashioned"
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Técnica">
              <input
                value={tecnica}
                onChange={(evento) => setTecnica(evento.currentTarget.value)}
                placeholder="Batido, directo…"
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Herramientas" ayuda="Separadas por coma">
              <input
                value={herramientas}
                onChange={(evento) => setHerramientas(evento.currentTarget.value)}
                placeholder="Shaker, jigger"
                className={CAMPO}
              />
            </Campo>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-2">
            <Etiqueta>Ingredientes</Etiqueta>
            <button
              type="button"
              onClick={() => setFilas((actual) => [...actual, { ...FILA_VACIA }])}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <Plus size={12} />
              Agregar
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {filas.map((fila, indice) => (
              <div key={indice} className="flex gap-2">
                <input
                  value={fila.nombre}
                  onChange={(evento) =>
                    actualizarFila(indice, { nombre: evento.currentTarget.value })
                  }
                  placeholder="Ingrediente"
                  className={CAMPO}
                />
                <input
                  value={fila.cantidad}
                  onChange={(evento) =>
                    actualizarFila(indice, { cantidad: evento.currentTarget.value })
                  }
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Cant."
                  className="h-10 w-20 rounded-xl border border-outline-variant/60 bg-surface-container-low px-2 text-sm text-heading placeholder:text-pebble focus:border-primary focus:outline-none"
                />
                <select
                  value={fila.unidad}
                  onChange={(evento) =>
                    actualizarFila(indice, { unidad: evento.currentTarget.value })
                  }
                  className="h-10 w-24 cursor-pointer rounded-xl border border-outline-variant/60 bg-surface-container-low px-2 text-sm text-heading focus:border-primary focus:outline-none"
                >
                  {UNIDADES.map((unidad) => (
                    <option key={unidad.valor} value={unidad.valor}>
                      {unidad.valor}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setFilas((actual) =>
                      actual.length === 1
                        ? [{ ...FILA_VACIA }]
                        : actual.filter((_, posicion) => posicion !== indice),
                    )
                  }
                  aria-label="Quitar ingrediente"
                  className="grid size-10 shrink-0 place-items-center rounded-full text-pebble transition-colors hover:bg-error-container hover:text-on-error-container"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <Etiqueta>Pasos</Etiqueta>
            <button
              type="button"
              onClick={() => setPasos((actual) => [...actual, ""])}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <Plus size={12} />
              Agregar paso
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {pasos.map((paso, indice) => (
              <div key={indice} className="flex items-start gap-2">
                <span className="mt-2.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-container-high text-[10px] font-bold text-on-surface-variant">
                  {indice + 1}
                </span>
                <textarea
                  value={paso}
                  onChange={(evento) =>
                    actualizarPaso(indice, evento.currentTarget.value)
                  }
                  rows={2}
                  placeholder={`Paso ${indice + 1}`}
                  className={CAMPO_TEXTAREA}
                />
                <button
                  type="button"
                  onClick={() =>
                    setPasos((actual) =>
                      actual.length === 1
                        ? [""]
                        : actual.filter((_, posicion) => posicion !== indice),
                    )
                  }
                  aria-label="Quitar paso"
                  className="mt-1 grid size-8 shrink-0 place-items-center rounded-full text-pebble transition-colors hover:bg-error-container hover:text-on-error-container"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Campo etiqueta="Tips" ayuda="Opcional">
          <textarea
            value={tips}
            onChange={(evento) => setTips(evento.currentTarget.value)}
            rows={2}
            className={CAMPO_TEXTAREA}
            placeholder="Trucos, reemplazos, cómo guardarlo…"
          />
        </Campo>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pendiente}>
            {pendiente && <Loader2 size={15} className="animate-spin" />}
            {receta ? "Guardar cambios" : "Crear receta"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
