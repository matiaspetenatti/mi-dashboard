"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Heart,
  Loader2,
  Pencil,
  ShoppingBasket,
  Trash2,
  Utensils,
  Martini,
  Check,
  Users,
} from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import {
  alternarFavorita,
  cocinarReceta,
  eliminarReceta,
} from "../actions/recetas";
import { agregarFaltantesReceta } from "../actions/lista";
import { etiquetaTipoReceta, etiquetaTono } from "../constantes";
import { formatearCantidad } from "../lib/cantidades";
import {
  calcularFaltantes,
  proponerDescuento,
  type DescuentoPropuesto,
} from "../lib/inventario";
import type { ItemComida, RecetaComida } from "../schema";
import { Etiqueta } from "./campos";

export function DetalleReceta({
  receta,
  items,
  abierto,
  onOpenChange,
  onEditar,
}: {
  receta: RecetaComida;
  items: ItemComida[];
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  onEditar: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [favorita, setFavorita] = useState(receta.favorita);
  const [eliminarAbierto, setEliminarAbierto] = useState(false);
  const [descuentoAbierto, setDescuentoAbierto] = useState(false);
  const [descuentos, setDescuentos] = useState<DescuentoPropuesto[]>([]);
  const [paginaActual, setPaginaActual] = useState(0);
  const INGREDIENTES_POR_PAGINA = 10;

  const faltantes = useMemo(
    () => calcularFaltantes(receta.ingredientes, items),
    [receta.ingredientes, items],
  );
  const faltantesObligatorios = faltantes.filter((faltante) => !faltante.opcional);

  const ingredientesPaginados = useMemo(
    () =>
      receta.ingredientes.slice(
        paginaActual * INGREDIENTES_POR_PAGINA,
        (paginaActual + 1) * INGREDIENTES_POR_PAGINA,
      ),
    [receta.ingredientes, paginaActual],
  );

  const esTrago = receta.tipo === "trago";

  function cambiarFavorita() {
    const nuevo = !favorita;
    setFavorita(nuevo);

    iniciar(async () => {
      const resultado = await alternarFavorita(receta.id, nuevo);
      if (!resultado.ok) {
        setFavorita(!nuevo);
        toast.error(resultado.error);
      } else {
        router.refresh();
      }
    });
  }

  function agregarFaltantes() {
    iniciar(async () => {
      const resultado = await agregarFaltantesReceta(receta.id);
      if (resultado.ok) {
        toast.success(
          resultado.agregados && resultado.agregados > 0
            ? `${resultado.agregados} ítems agregados a la lista`
            : "No faltaba nada nuevo",
          { description: "Revisá la pestaña Compras." },
        );
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function abrirDescuento() {
    const propuesta = proponerDescuento(receta.ingredientes, items);
    if (propuesta.length === 0) {
      toast.info("No hay stock para descontar", {
        description: "Los ingredientes no coinciden con la despensa actual.",
      });
      return;
    }
    setDescuentos(propuesta);
    setDescuentoAbierto(true);
  }

  function confirmarCoccion() {
    iniciar(async () => {
      const resultado = await cocinarReceta(
        receta.id,
        descuentos
          .filter((descuento) => descuento.cantidad > 0)
          .map((descuento) => ({
            ingredienteId: descuento.ingredienteId,
            cantidad: descuento.cantidad,
          })),
      );

      if (resultado.ok) {
        setDescuentoAbierto(false);
        onOpenChange(false);
        toast.success("Receta cocinada", {
          description: "Actualizamos el stock y el contador del recetario.",
        });
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function eliminar() {
    iniciar(async () => {
      const resultado = await eliminarReceta(receta.id);
      if (resultado.ok) {
        setEliminarAbierto(false);
        onOpenChange(false);
        toast.success("Receta eliminada");
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  return (
    <>
      <Dialogo
        abierto={abierto}
        onOpenChange={onOpenChange}
        titulo={receta.titulo}
        descripcion={`${etiquetaTipoReceta(receta.tipo)} · ${etiquetaTono(
          receta.tono,
        )} · ${receta.minutos} min`}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={esTrago ? "tertiary" : "primary"}>
              {esTrago ? <Martini size={11} /> : <Utensils size={11} />}
              {etiquetaTipoReceta(receta.tipo)}
            </Badge>
            <Badge variant="neutral">
              <Clock3 size={11} />
              {receta.minutos} min
            </Badge>
            {!esTrago && (
              <Badge variant="outline">
                <Users size={11} />
                {receta.porciones} porciones
              </Badge>
            )}
            {receta.origen === "ia" && <Badge variant="outline">IA</Badge>}
            {receta.vecesCocinada > 0 && (
              <Badge variant="success">
                <Check size={11} />
                {receta.vecesCocinada}{" "}
                {receta.vecesCocinada === 1 ? "vez" : "veces"}
              </Badge>
            )}
            <button
              type="button"
              onClick={cambiarFavorita}
              disabled={pendiente}
              aria-pressed={favorita}
              className={cn(
                "ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
                favorita
                  ? "bg-error-container text-on-error-container"
                  : "bg-surface-container text-on-surface-variant hover:text-heading",
              )}
            >
              <Heart size={12} fill={favorita ? "currentColor" : "none"} />
              {favorita ? "Favorita" : "Guardar"}
            </button>
          </div>

          {esTrago && (receta.vaso || receta.tecnica || receta.herramientas.length > 0) && (
            <div className="grid gap-2 sm:grid-cols-3">
              {receta.vaso && (
                <div className="rounded-xl bg-surface-bright p-2.5">
                  <Etiqueta>Vaso</Etiqueta>
                  <p className="text-sm font-semibold text-heading">{receta.vaso}</p>
                </div>
              )}
              {receta.tecnica && (
                <div className="rounded-xl bg-surface-bright p-2.5">
                  <Etiqueta>Técnica</Etiqueta>
                  <p className="text-sm font-semibold text-heading">{receta.tecnica}</p>
                </div>
              )}
              {receta.herramientas.length > 0 && (
                <div className="rounded-xl bg-surface-bright p-2.5">
                  <Etiqueta>Herramientas</Etiqueta>
                  <p className="text-sm font-semibold text-heading">
                    {receta.herramientas.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <Etiqueta>Ingredientes</Etiqueta>
              <ul className="mt-1.5 space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {ingredientesPaginados.map((ingrediente, indice) => {
                  const falta = faltantes.some(
                    (faltante) =>
                      faltante.nombre === ingrediente.nombre &&
                      !faltante.enStock,
                  );
                  return (
                    <li
                      key={`${ingrediente.nombre}-${indice}`}
                      className="flex items-start justify-between gap-2 border-b border-outline-variant/25 pb-1.5 text-xs last:border-0"
                    >
                      <span className="text-charcoal">
                        {ingrediente.nombre}
                        {ingrediente.opcional && (
                          <span className="ml-1 text-[9px] font-bold uppercase text-pebble">
                            opcional
                          </span>
                        )}
                        {falta && (
                          <span className="ml-1 text-[9px] font-bold uppercase text-error">
                            falta
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-bold text-heading">
                        {formatearCantidad(ingrediente.cantidad, ingrediente.unidad)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {receta.ingredientes.length > INGREDIENTES_POR_PAGINA && (
                <div className="flex items-center justify-between gap-3 mt-2 border-t border-outline-variant/25 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((actual) => Math.max(0, actual - 1))}
                    disabled={paginaActual === 0}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    {paginaActual * INGREDIENTES_POR_PAGINA + 1}-{" "}
                    {Math.min(
                      (paginaActual + 1) * INGREDIENTES_POR_PAGINA,
                      receta.ingredientes.length,
                    )} de {receta.ingredientes.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPaginaActual((actual) => actual + 1)
                    }
                    disabled={
                      (paginaActual + 1) * INGREDIENTES_POR_PAGINA >=
                      receta.ingredientes.length
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}

              {faltantesObligatorios.length > 0 && (
                <div className="mt-3 rounded-xl border border-warning/30 bg-warning-container/30 p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-warning-container">
                    Faltan {faltantesObligatorios.length}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-on-surface-variant">
                    {faltantesObligatorios
                      .map((faltante) => faltante.nombre)
                      .join(", ")}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={agregarFaltantes}
                    disabled={pendiente}
                  >
                    <ShoppingBasket size={13} />
                    Agregar a compras
                  </Button>
                </div>
              )}

              {receta.nutricion && (
                <div className="mt-3 rounded-xl border border-outline-variant/50 bg-surface-bright p-2.5">
                  <div className="flex items-center justify-between">
                    <Etiqueta>Nutrición</Etiqueta>
                    <span className="text-[9px] font-bold uppercase text-pebble">
                      Estimado
                    </span>
                  </div>
                  <p className="mt-0.5 text-base font-extrabold text-heading">
                    {receta.nutricion.kcal} kcal
                  </p>
                  <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[10px]">
                    <div>
                      <p className="font-bold text-heading">
                        {receta.nutricion.proteinas} g
                      </p>
                      <p className="text-pebble">Proteínas</p>
                    </div>
                    <div>
                      <p className="font-bold text-heading">
                        {receta.nutricion.carbos} g
                      </p>
                      <p className="text-pebble">Carbos</p>
                    </div>
                    <div>
                      <p className="font-bold text-heading">
                        {receta.nutricion.grasas} g
                      </p>
                      <p className="text-pebble">Grasas</p>
                    </div>
                    <div>
                      <p className="font-bold text-heading">
                        {receta.nutricion.fibra} g
                      </p>
                      <p className="text-pebble">Fibra</p>
                    </div>
                    <div>
                      <p className="font-bold text-heading">
                        {receta.nutricion.azucares} g
                      </p>
                      <p className="text-pebble">Azúcares</p>
                    </div>
                    <div>
                      <p className="font-bold text-heading">
                        {receta.nutricion.sodio} g
                      </p>
                      <p className="text-pebble">Sodio</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Etiqueta>Preparación</Etiqueta>
              <ol className="mt-1.5 space-y-2">
                {receta.pasos.map((paso, indice) => (
                  <li key={indice} className="flex gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-inverse-surface text-[10px] font-bold text-inverse-on-surface">
                      {indice + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-charcoal">{paso}</p>
                  </li>
                ))}
              </ol>

              {receta.tips && (
                <div className="mt-3 rounded-xl border border-tertiary/25 bg-tertiary-container/25 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-tertiary-container">
                    Tip
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-charcoal">
                    {receta.tips}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/40 pt-3">
            <Button
              size="sm"
              onClick={abrirDescuento}
              disabled={pendiente}
              className="bg-lime-voltage text-forest-ink hover:brightness-105"
            >
              <Utensils size={14} />
              Cocinar y descontar
            </Button>
            <Button size="sm" variant="secondary" onClick={onEditar} disabled={pendiente}>
              <Pencil size={13} />
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEliminarAbierto(true)}
              disabled={pendiente}
              className="text-error hover:bg-error-container/40"
            >
              <Trash2 size={13} />
              Eliminar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="ml-auto"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Dialogo>

      <Dialogo
        abierto={eliminarAbierto}
        onOpenChange={setEliminarAbierto}
        titulo="Eliminar receta"
        descripcion={`"${receta.titulo}" se borra del recetario. Esta acción no se puede deshacer.`}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setEliminarAbierto(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={eliminar} disabled={pendiente}>
            {pendiente && <Loader2 size={15} className="animate-spin" />}
            Eliminar
          </Button>
        </div>
      </Dialogo>

      <Dialogo
        abierto={descuentoAbierto}
        onOpenChange={setDescuentoAbierto}
        titulo="Confirmar descuento de stock"
        descripcion="Revisá las cantidades. Podés poner 0 para no descontar un ingrediente."
      >
        <div className="space-y-2">
          {descuentos.map((descuento, indice) => (
            <div
              key={descuento.ingredienteId}
              className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/50 bg-surface-bright px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-heading">
                  {descuento.nombre}
                </p>
                <p className="text-[10px] text-pebble">
                  Tenés {formatearCantidad(descuento.stockActual, descuento.unidad)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={descuento.cantidad}
                  onChange={(evento) => {
                    const valor = Number(evento.currentTarget.value);
                    setDescuentos((actual) =>
                      actual.map((item, posicion) =>
                        posicion === indice
                          ? {
                              ...item,
                              cantidad: Number.isFinite(valor) ? valor : 0,
                              restante: Math.max(
                                0,
                                item.stockActual - (Number.isFinite(valor) ? valor : 0),
                              ),
                            }
                          : item,
                      ),
                    );
                  }}
                  className="h-8 w-20 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 text-right text-sm font-semibold text-heading focus:border-primary focus:outline-none"
                />
                <span className="text-[10px] font-semibold text-pebble">
                  {descuento.unidad}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setDescuentoAbierto(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button onClick={confirmarCoccion} disabled={pendiente}>
            {pendiente && <Loader2 size={15} className="animate-spin" />}
            Confirmar y cocinar
          </Button>
        </div>
      </Dialogo>
    </>
  );
}
