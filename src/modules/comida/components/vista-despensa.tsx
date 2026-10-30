"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import { eliminarIngrediente } from "../actions/ingredientes";
import {
  CATEGORIAS,
  DIAS_POR_VENCER,
  emojiCategoria,
  etiquetaCategoria,
  etiquetaUbicacion,
} from "../constantes";
import { formatearCantidad, normalizarNombre } from "../lib/cantidades";
import { vencimientoDe, type EstadoVencimiento } from "../lib/inventario";
import type { ItemComida } from "../schema";
import { Chip, Etiqueta, GrupoChips, Vacio } from "./campos";
import { FormularioIngrediente } from "./formulario-ingrediente";

const ESTILO_VENCIMIENTO: Record<EstadoVencimiento, string> = {
  vencido: "bg-error-container text-on-error-container",
  hoy: "bg-error-container text-on-error-container",
  pronto: "bg-warning-container text-on-warning-container",
  ok: "bg-surface-container text-on-surface-variant",
  "sin-fecha": "bg-surface-container text-pebble",
};

function Medallon({ categoria }: { categoria: string }) {
  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container text-base"
    >
      {emojiCategoria(categoria)}
    </span>
  );
}

function Vencimiento({ caducaEn, hoy }: { caducaEn: string | null; hoy: string }) {
  const vencimiento = vencimientoDe(caducaEn, hoy);
  if (vencimiento.estado === "sin-fecha") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
        ESTILO_VENCIMIENTO[vencimiento.estado],
      )}
    >
      {vencimiento.texto}
    </span>
  );
}

function AccionesItem({
  item,
  onEditar,
  onEliminar,
}: {
  item: ItemComida;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/comida?vista=chef&items=${item.id}`}
        title="Usar en el Chef IA"
        className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
      >
        <ChefHat size={15} />
      </Link>
      <button
        type="button"
        onClick={onEditar}
        title="Editar"
        className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-heading"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={onEliminar}
        title="Eliminar"
        className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function VistaDespensa({
  items,
  hoy,
}: {
  items: ItemComida[];
  hoy: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [editando, setEditando] = useState<ItemComida | null>(null);
  const [aEliminar, setAEliminar] = useState<ItemComida | null>(null);

  const ingredientes = useMemo(
    () => items.filter((item) => item.tipo === "ingrediente"),
    [items],
  );
  const utensilios = useMemo(
    () => items.filter((item) => item.tipo === "utensilio"),
    [items],
  );

  const categoriasPresentes = useMemo(
    () =>
      CATEGORIAS.filter((opcion) =>
        ingredientes.some((item) => item.categoria === opcion.valor),
      ),
    [ingredientes],
  );

  const filtrados = useMemo(() => {
    const texto = normalizarNombre(busqueda);
    return ingredientes.filter((item) => {
      if (categoria !== "todas" && item.categoria !== categoria) return false;
      if (!texto) return true;
      return normalizarNombre(item.nombre).includes(texto);
    });
  }, [ingredientes, categoria, busqueda]);

  const urgentes = useMemo(
    () =>
      ingredientes.filter((item) => {
        const vencimiento = vencimientoDe(item.caducaEn, hoy);
        return (
          vencimiento.estado === "vencido" ||
          (vencimiento.dias !== null && vencimiento.dias <= DIAS_POR_VENCER)
        );
      }),
    [ingredientes, hoy],
  );

  function eliminar() {
    if (!aEliminar) return;
    const objetivo = aEliminar;

    iniciar(async () => {
      const resultado = await eliminarIngrediente(objetivo.id);
      if (resultado.ok) {
        toast.success("Ítem eliminado", {
          description: `${objetivo.nombre} salió de la despensa.`,
        });
        setAEliminar(null);
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Etiqueta>Inventario</Etiqueta>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-heading">
              Ingredientes en despensa
            </h2>
            <p className="text-xs text-on-surface-variant">
              {ingredientes.length}{" "}
              {ingredientes.length === 1 ? "ingrediente cargado" : "ingredientes cargados"}
              {utensilios.length > 0
                ? ` · ${utensilios.length} utensilios de barra`
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pebble"
              />
              <input
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.currentTarget.value)}
                placeholder="Buscar ingrediente…"
                aria-label="Buscar ingrediente"
                className="h-9 w-full rounded-full border border-outline-variant/60 bg-surface-container-low pl-9 pr-3 text-sm text-heading placeholder:text-pebble focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-56"
              />
            </div>
            <Button
              onClick={() => setNuevoAbierto(true)}
              size="sm"
              className="bg-lime-voltage text-forest-ink hover:brightness-105"
            >
              <Plus size={15} />
              Agregar ítem
            </Button>
          </div>
        </div>

        {categoriasPresentes.length > 0 && (
          <GrupoChips className="mt-4">
            <Chip
              activo={categoria === "todas"}
              onClick={() => setCategoria("todas")}
            >
              Todas
            </Chip>
            {categoriasPresentes.map((opcion) => (
              <Chip
                key={opcion.valor}
                activo={categoria === opcion.valor}
                onClick={() => setCategoria(opcion.valor)}
              >
                <span aria-hidden>{opcion.emoji}</span>
                {opcion.label}
              </Chip>
            ))}
          </GrupoChips>
        )}

        {urgentes.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-warning/25 bg-warning-container/40 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-warning-container">
              Usá primero
            </span>
            {urgentes.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest px-2.5 py-1 text-[11px] font-semibold text-heading"
              >
                {item.nombre}
                <span className="font-normal text-on-surface-variant">
                  · {vencimientoDe(item.caducaEn, hoy).texto}
                </span>
              </span>
            ))}
          </div>
        )}

        {ingredientes.length === 0 ? (
          <div className="mt-4">
            <Vacio
              icono={<Warehouse size={20} />}
              titulo="La despensa está vacía"
              descripcion="Cargá lo que tenés en la heladera y la alacena. Después el Chef IA puede armar recetas con eso."
              accion={
                <Button onClick={() => setNuevoAbierto(true)} size="sm">
                  <Plus size={15} />
                  Cargar el primer ingrediente
                </Button>
              }
            />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-outline-variant/60 px-4 py-8 text-center text-sm text-on-surface-variant">
            No hay ingredientes que coincidan con el filtro.
          </p>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="mt-4 hidden overflow-hidden rounded-xl border border-outline-variant/40 md:block">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low text-left text-[10px] uppercase tracking-wider text-pebble">
                  <tr>
                    <th className="px-3 py-2 font-bold">Ingrediente</th>
                    <th className="px-3 py-2 font-bold">Categoría</th>
                    <th className="px-3 py-2 font-bold">Cantidad</th>
                    <th className="px-3 py-2 font-bold">Dónde</th>
                    <th className="px-3 py-2 font-bold">Vence</th>
                    <th className="px-3 py-2 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filtrados.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-surface-bright"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Medallon categoria={item.categoria} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-heading">
                              {item.nombre}
                            </p>
                            {item.notas && (
                              <p className="truncate text-[11px] text-pebble">
                                {item.notas}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-on-surface-variant">
                        {etiquetaCategoria(item.categoria)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-heading">
                        {formatearCantidad(item.cantidad, item.unidad)}
                        {item.stockMinimo !== null &&
                          item.cantidad <= item.stockMinimo && (
                            <span
                              title="En el stock mínimo"
                              className="ml-1.5 inline-block size-1.5 rounded-full bg-warning align-middle"
                            />
                          )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-on-surface-variant">
                        {etiquetaUbicacion(item.ubicacion)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Vencimiento caducaEn={item.caducaEn} hoy={hoy} />
                        {!item.caducaEn && (
                          <span className="text-[11px] text-pebble">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <AccionesItem
                          item={item}
                          onEditar={() => setEditando(item)}
                          onEliminar={() => setAEliminar(item)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="mt-4 space-y-2 md:hidden">
              {filtrados.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-outline-variant/40 bg-surface-bright p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <Medallon categoria={item.categoria} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-heading">
                        {item.nombre}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {formatearCantidad(item.cantidad, item.unidad)} ·{" "}
                        {etiquetaUbicacion(item.ubicacion)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-pebble">
                          {etiquetaCategoria(item.categoria)}
                        </span>
                        <Vencimiento caducaEn={item.caducaEn} hoy={hoy} />
                      </div>
                    </div>
                    <AccionesItem
                      item={item}
                      onEditar={() => setEditando(item)}
                      onEliminar={() => setAEliminar(item)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {utensilios.length > 0 && (
        <section className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Etiqueta>Barra</Etiqueta>
              <h2 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-heading">
                <UtensilsCrossed size={16} className="text-tertiary" />
                Utensilios de coctelería
              </h2>
              <p className="text-xs text-on-surface-variant">
                El Chef IA solo usa las herramientas que tengas cargadas acá.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setNuevoAbierto(true)}>
              <Plus size={14} />
              Agregar
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {utensilios.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-heading"
              >
                {item.nombre}
                <button
                  type="button"
                  onClick={() => setEditando(item)}
                  aria-label={`Editar ${item.nombre}`}
                  className="text-pebble transition-colors hover:text-heading"
                >
                  <Pencil size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => setAEliminar(item)}
                  aria-label={`Eliminar ${item.nombre}`}
                  className="text-pebble transition-colors hover:text-error"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      <FormularioIngrediente
        abierto={nuevoAbierto}
        onOpenChange={setNuevoAbierto}
      />

      {editando && (
        <FormularioIngrediente
          key={editando.id}
          abierto
          onOpenChange={(abierto) => {
            if (!abierto) setEditando(null);
          }}
          item={editando}
        />
      )}

      <Dialogo
        abierto={aEliminar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setAEliminar(null);
        }}
        titulo="Eliminar ítem"
        descripcion={
          aEliminar
            ? `"${aEliminar.nombre}" va a salir de la despensa. Las recetas guardadas no se modifican.`
            : ""
        }
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setAEliminar(null)}
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
    </div>
  );
}
