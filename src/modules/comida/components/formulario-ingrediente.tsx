"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import {
  actualizarIngrediente,
  crearIngrediente,
} from "../actions/ingredientes";
import {
  CATEGORIAS,
  TIPOS_ITEM,
  UBICACIONES,
  UNIDADES,
} from "../constantes";
import { categoriaSugerida } from "../lib/inventario";
import type { ItemComida } from "../schema";
import { CAMPO, CAMPO_SELECT, Campo } from "./campos";

export function FormularioIngrediente({
  abierto,
  onOpenChange,
  item,
}: {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  item?: ItemComida | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [tipo, setTipo] = useState(item?.tipo ?? "ingrediente");
  const [categoria, setCategoria] = useState(item?.categoria ?? "otros");
  const [categoriaManual, setCategoriaManual] = useState(Boolean(item));

  function sugerirCategoria(nombre: string) {
    if (categoriaManual) return;
    setCategoria(categoriaSugerida(nombre));
  }

  function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);

    iniciar(async () => {
      const resultado = item
        ? await actualizarIngrediente(item.id, formData)
        : await crearIngrediente(formData);

      if (resultado.ok) {
        toast.success(item ? "Ítem actualizado" : "Ítem agregado", {
          description: item
            ? "Los cambios ya están en la despensa."
            : "Ya podés usarlo en el Chef IA.",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  const esUtensilio = tipo === "utensilio";

  return (
    <Dialogo
      abierto={abierto}
      onOpenChange={onOpenChange}
      titulo={item ? "Editar ítem" : "Agregar a la despensa"}
      descripcion={
        esUtensilio
          ? "Los utensilios no tienen stock ni vencimiento: la IA los usa como herramientas de barra."
          : "Cargá lo que tenés en heladera, freezer o alacena. La cantidad se puede ajustar después."
      }
    >
      <form onSubmit={guardar} className="space-y-4">
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="categoria" value={categoria} />

        <div className="flex gap-1 rounded-full border border-outline-variant/40 bg-surface-container-low p-1">
          {TIPOS_ITEM.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => {
                setTipo(opcion.valor);
                if (opcion.valor === "utensilio") setCategoria("bar");
              }}
              className={
                tipo === opcion.valor
                  ? "flex-1 rounded-full bg-inverse-surface px-3 py-1.5 text-xs font-bold text-inverse-on-surface"
                  : "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
              }
            >
              {opcion.label}
            </button>
          ))}
        </div>

        <Campo etiqueta="Nombre">
          <input
            name="nombre"
            required
            maxLength={120}
            defaultValue={item?.nombre ?? ""}
            placeholder={esUtensilio ? "Shaker, jigger, colador…" : "Pechuga de pollo"}
            onChange={(evento) => sugerirCategoria(evento.currentTarget.value)}
            className={CAMPO}
          />
        </Campo>

        {!esUtensilio && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Cantidad">
                <input
                  name="cantidad"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  defaultValue={item?.cantidad ?? ""}
                  placeholder="0"
                  className={CAMPO}
                />
              </Campo>
              <Campo etiqueta="Unidad">
                <select
                  name="unidad"
                  defaultValue={item?.unidad ?? "unidad"}
                  className={CAMPO_SELECT}
                >
                  {UNIDADES.map((unidad) => (
                    <option key={unidad.valor} value={unidad.valor}>
                      {unidad.label}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Ubicación">
                <select
                  name="ubicacion"
                  defaultValue={item?.ubicacion ?? "despensa"}
                  className={CAMPO_SELECT}
                >
                  {UBICACIONES.map((ubicacion) => (
                    <option key={ubicacion.valor} value={ubicacion.valor}>
                      {ubicacion.label}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Categoría">
                <select
                  value={categoria}
                  onChange={(evento) => {
                    setCategoria(evento.currentTarget.value);
                    setCategoriaManual(true);
                  }}
                  className={CAMPO_SELECT}
                >
                  {CATEGORIAS.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.emoji} {opcion.label}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          </>
        )}

        {esUtensilio && (
          <Campo etiqueta="Categoría">
            <select
              value={categoria}
              onChange={(evento) => {
                setCategoria(evento.currentTarget.value);
                setCategoriaManual(true);
              }}
              className={CAMPO_SELECT}
            >
              {CATEGORIAS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.emoji} {opcion.label}
                </option>
              ))}
            </select>
          </Campo>
        )}

        {!esUtensilio && (
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Vence" ayuda="Opcional">
              <input
                name="caducaEn"
                type="date"
                defaultValue={item?.caducaEn ?? ""}
                className={CAMPO}
              />
            </Campo>
            <Campo etiqueta="Stock mínimo" ayuda="Para avisarte cuando falte">
              <input
                name="stockMinimo"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={item?.stockMinimo ?? ""}
                placeholder="Opcional"
                className={CAMPO}
              />
            </Campo>
          </div>
        )}

        <Campo etiqueta="Notas" ayuda="Opcional">
          <input
            name="notas"
            maxLength={500}
            defaultValue={item?.notas ?? ""}
            placeholder="Ej. abierto, congelado, marca…"
            className={CAMPO}
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
            {item ? "Guardar cambios" : "Agregar ítem"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
