"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleDollarSign,
  Loader2,
  PackageCheck,
  Pencil,
  Plus,
  ShoppingBasket,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import { formatMonto } from "@/lib/format";
import {
  actualizarItemLista,
  actualizarPrecioLista,
  agregarItemLista,
  agregarSugerenciasStock,
  alternarComprado,
  eliminarItemLista,
  limpiarComprados,
} from "../actions/lista";
import {
  CATEGORIAS,
  ORIGENES_LISTA,
  UNIDADES,
  categoriaComida,
  type CategoriaComida,
} from "../constantes";
import { formatearCantidad } from "../lib/cantidades";
import { categoriaSugerida } from "../lib/inventario";
import type { ItemComida, ItemListaComida } from "../schema";
import {
  CAMPO,
  CAMPO_SELECT,
  Campo,
  Chip,
  Etiqueta,
  GrupoChips,
} from "./campos";

const ESTILO_ORIGEN: Record<string, string> = {
  manual: "bg-surface-container text-on-surface-variant",
  stock: "bg-warning-container text-on-warning-container",
  receta: "bg-secondary-container text-on-secondary-container",
  menu: "bg-tertiary-container text-on-tertiary-container",
};

function etiquetaOrigen(origen: string) {
  return ORIGENES_LISTA.find((opcion) => opcion.valor === origen)?.label ?? "Manual";
}

function PrecioInput({
  item,
  onGuardar,
  disabled,
}: {
  item: ItemListaComida;
  onGuardar: (centavos: number | null) => void;
  disabled: boolean;
}) {
  const [valor, setValor] = useState(
    item.precioCentavos === null ? "" : (item.precioCentavos / 100).toFixed(2),
  );

  function confirmar() {
    const limpio = valor.trim().replace(",", ".");
    if (limpio === "") {
      if (item.precioCentavos !== null) onGuardar(null);
      return;
    }
    const pesos = Number(limpio);
    if (!Number.isFinite(pesos) || pesos < 0) {
      setValor(
        item.precioCentavos === null ? "" : (item.precioCentavos / 100).toFixed(2),
      );
      return;
    }
    const centavos = Math.round(pesos * 100);
    if (centavos !== item.precioCentavos) onGuardar(centavos);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-pebble">
        $
      </span>
      <input
        value={valor}
        onChange={(evento) => setValor(evento.currentTarget.value)}
        onBlur={confirmar}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            evento.currentTarget.blur();
          }
        }}
        inputMode="decimal"
        placeholder="0,00"
        aria-label={`Precio de ${item.nombre}`}
        disabled={disabled}
        className="h-8 w-24 rounded-lg border border-outline-variant/60 bg-surface-container-lowest pl-5 pr-2 text-right text-xs font-semibold text-heading placeholder:text-pebble focus:border-primary focus:outline-none disabled:opacity-50"
      />
    </div>
  );
}

function FilaPendiente({
  item,
  pendiente,
  onComprado,
  onPrecio,
  onEditar,
  onEliminar,
}: {
  item: ItemListaComida;
  pendiente: boolean;
  onComprado: (comprado: boolean) => void;
  onPrecio: (centavos: number | null) => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  return (
    <li className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-surface-bright">
      <button
        type="button"
        onClick={() => onComprado(true)}
        disabled={pendiente}
        aria-label={`Marcar ${item.nombre} como comprado`}
        className="grid size-7 shrink-0 place-items-center rounded-full border border-outline-variant text-transparent transition-colors hover:border-primary hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50"
      >
        <Check size={13} />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-heading">{item.nombre}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-on-surface-variant">
            {formatearCantidad(item.cantidad, item.unidad)}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              ESTILO_ORIGEN[item.origen] ?? ESTILO_ORIGEN.manual,
            )}
          >
            {etiquetaOrigen(item.origen)}
          </span>
        </div>
      </div>

      <PrecioInput item={item} onGuardar={onPrecio} disabled={pendiente} />

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onEditar}
          disabled={pendiente}
          title="Editar ítem"
          className="grid size-7 place-items-center rounded-full text-pebble transition-colors hover:bg-surface-container hover:text-heading disabled:opacity-50"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={onEliminar}
          disabled={pendiente}
          title="Eliminar ítem"
          className="grid size-7 place-items-center rounded-full text-pebble transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-50"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </li>
  );
}

function FormularioLista({
  item,
  pendiente,
  onGuardar,
  onCancelar,
}: {
  item?: ItemListaComida;
  pendiente: boolean;
  onGuardar: (
    evento: React.FormEvent<HTMLFormElement>,
    item?: ItemListaComida,
  ) => void;
  onCancelar: () => void;
}) {
  const [categoriaForm, setCategoriaForm] = useState(item?.categoria ?? "otros");
  const [categoriaManual, setCategoriaManual] = useState(Boolean(item));

  function sugerirCategoria(nombre: string) {
    if (categoriaManual) return;
    setCategoriaForm(categoriaSugerida(nombre));
  }

  return (
    <form onSubmit={(evento) => onGuardar(evento, item)} className="space-y-3">
      <input type="hidden" name="categoria" value={categoriaForm} />

      <Campo etiqueta="Nombre">
        <input
          name="nombre"
          required
          maxLength={120}
          defaultValue={item?.nombre ?? ""}
          placeholder="Ej. Leche entera"
          onChange={(evento) => sugerirCategoria(evento.currentTarget.value)}
          className={CAMPO}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Cantidad">
          <input
            name="cantidad"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            defaultValue={item?.cantidad ?? 1}
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
        <Campo etiqueta="Categoría">
          <select
            value={categoriaForm}
            onChange={(evento) => {
              setCategoriaForm(evento.currentTarget.value);
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
        <Campo etiqueta="Precio" ayuda="Opcional, en pesos">
          <input
            name="precio"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={
              item?.precioCentavos == null ? "" : item.precioCentavos / 100
            }
            placeholder="0,00"
            className={CAMPO}
          />
        </Campo>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancelar}
          disabled={pendiente}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pendiente}>
          {pendiente && <Loader2 size={15} className="animate-spin" />}
          {item ? "Guardar cambios" : "Agregar a la lista"}
        </Button>
      </div>
    </form>
  );
}

export function VistaCompras({
  lista,
  items,
}: {
  lista: ItemListaComida[];
  items: ItemComida[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [categoria, setCategoria] = useState<CategoriaComida | "todas">("todas");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [editando, setEditando] = useState<ItemListaComida | null>(null);
  const [limpiarAbierto, setLimpiarAbierto] = useState(false);

  const pendientes = useMemo(() => lista.filter((item) => !item.comprado), [lista]);
  const comprados = useMemo(() => lista.filter((item) => item.comprado), [lista]);

  const categoriasPresentes = useMemo(
    () =>
      CATEGORIAS.filter((opcion) =>
        pendientes.some((item) => item.categoria === opcion.valor),
      ),
    [pendientes],
  );

  const visibles = useMemo(
    () =>
      categoria === "todas"
        ? pendientes
        : pendientes.filter((item) => item.categoria === categoria),
    [pendientes, categoria],
  );

  const grupos = useMemo(() => {
    const mapa = new Map<string, ItemListaComida[]>();
    for (const item of visibles) {
      const clave = categoriaComida(item.categoria);
      const actual = mapa.get(clave) ?? [];
      actual.push(item);
      mapa.set(clave, actual);
    }
    return CATEGORIAS.filter((opcion) => mapa.has(opcion.valor)).map(
      (opcion) => ({
        categoria: opcion,
        items: mapa.get(opcion.valor) ?? [],
      }),
    );
  }, [visibles]);

  const totalPendiente = pendientes.reduce(
    (total, item) => total + (item.precioCentavos ?? 0),
    0,
  );
  const conPrecio = pendientes.filter((item) => item.precioCentavos !== null).length;
  const totalComprado = comprados.reduce(
    (total, item) => total + (item.precioCentavos ?? 0),
    0,
  );

  const sugerencias = useMemo(
    () =>
      items.filter(
        (item) =>
          item.tipo === "ingrediente" &&
          item.stockMinimo !== null &&
          item.cantidad <= item.stockMinimo &&
          !pendientes.some(
            (pendienteItem) =>
              pendienteItem.nombreNormalizado === item.nombreNormalizado,
          ),
      ),
    [items, pendientes],
  );

  function comprado(item: ItemListaComida, valor: boolean) {
    iniciar(async () => {
      const resultado = await alternarComprado(item.id, valor);
      if (resultado.ok) {
        toast.success(
          valor ? "Comprado" : "Devuelto a la lista",
          {
            description: valor
              ? `${item.nombre} se sumó al inventario.`
              : `${item.nombre} vuelve a pendientes.`,
          },
        );
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function precio(item: ItemListaComida, centavos: number | null) {
    iniciar(async () => {
      const resultado = await actualizarPrecioLista(item.id, centavos);
      if (resultado.ok) router.refresh();
      else toast.error(resultado.error);
    });
  }

  function eliminar(item: ItemListaComida) {
    iniciar(async () => {
      const resultado = await eliminarItemLista(item.id);
      if (resultado.ok) {
        toast.success("Ítem eliminado");
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function sugerir() {
    iniciar(async () => {
      const resultado = await agregarSugerenciasStock();
      if (resultado.ok) {
        toast.success(
          resultado.agregados && resultado.agregados > 0
            ? `${resultado.agregados} sugerencias agregadas`
            : "No hay sugerencias nuevas",
          { description: "Se basan en el stock mínimo de la despensa." },
        );
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function limpiar() {
    iniciar(async () => {
      const resultado = await limpiarComprados();
      if (resultado.ok) {
        setLimpiarAbierto(false);
        toast.success("Comprados eliminados de la lista");
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function guardar(evento: React.FormEvent<HTMLFormElement>, item?: ItemListaComida) {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);

    iniciar(async () => {
      const resultado = item
        ? await actualizarItemLista(item.id, formData)
        : await agregarItemLista(formData);

      if (resultado.ok) {
        toast.success(item ? "Ítem actualizado" : "Ítem agregado");
        setNuevoAbierto(false);
        setEditando(null);
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
            <Etiqueta>Lista de compras</Etiqueta>
            <h2 className="mt-0.5 flex items-center gap-2 text-xl font-bold tracking-tight text-heading">
              <ShoppingBasket size={18} className="text-primary" />
              {pendientes.length === 0
                ? "No hay nada pendiente"
                : `${pendientes.length} ${
                    pendientes.length === 1 ? "ítem por comprar" : "ítems por comprar"
                  }`}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {totalPendiente > 0
                ? `${formatMonto(totalPendiente)} estimados`
                : "Cargá precios para estimar el total"}
              {conPrecio > 0 && pendientes.length !== conPrecio
                ? ` · ${conPrecio} de ${pendientes.length} con precio`
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={sugerir}
              disabled={pendiente}
            >
              <Sparkles size={14} />
              Sugerencias
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setNuevoAbierto(true)}
              className="bg-lime-voltage text-forest-ink hover:brightness-105"
            >
              <Plus size={15} />
              Agregar ítem
            </Button>
          </div>
        </div>

        {categoriasPresentes.length > 1 && (
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

        {sugerencias.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-warning/25 bg-warning-container/40 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-warning-container">
              Stock bajo
            </span>
            {sugerencias.slice(0, 6).map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-[11px] font-semibold text-heading"
              >
                {item.nombre}
              </span>
            ))}
            <button
              type="button"
              onClick={sugerir}
              disabled={pendiente}
              className="ml-auto text-[11px] font-bold text-on-warning-container hover:underline disabled:opacity-50"
            >
              Sumar a la lista
            </button>
          </div>
        )}
      </section>

      {pendientes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-bright px-6 py-10 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-surface-container text-primary">
            <PackageCheck size={20} />
          </span>
          <p className="text-sm font-bold text-heading">Lista vacía</p>
          <p className="max-w-sm text-xs leading-relaxed text-on-surface-variant">
            Agregá ítems a mano, sumá los faltantes de una receta o del menú
            semanal, o usá las sugerencias por stock bajo.
          </p>
          <Button onClick={() => setNuevoAbierto(true)} size="sm">
            <Plus size={15} />
            Agregar el primer ítem
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => {
            const subtotal = grupo.items.reduce(
              (total, item) => total + (item.precioCentavos ?? 0),
              0,
            );
            return (
              <section
                key={grupo.categoria.valor}
                className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-card shadow-elevation-1"
              >
                <header className="flex items-center justify-between gap-2 border-b border-outline-variant/30 bg-surface-container-low/60 px-3 py-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    <span aria-hidden>{grupo.categoria.emoji}</span>
                    {grupo.categoria.label}
                  </h3>
                  <span className="text-[11px] font-semibold text-pebble">
                    {grupo.items.length}{" "}
                    {grupo.items.length === 1 ? "ítem" : "ítems"}
                    {subtotal > 0 ? ` · ${formatMonto(subtotal)}` : ""}
                  </span>
                </header>
                <ul className="divide-y divide-outline-variant/25">
                  {grupo.items.map((item) => (
                    <FilaPendiente
                      key={item.id}
                      item={item}
                      pendiente={pendiente}
                      onComprado={(valor) => comprado(item, valor)}
                      onPrecio={(centavos) => precio(item, centavos)}
                      onEditar={() => setEditando(item)}
                      onEliminar={() => eliminar(item)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {visibles.length === 0 && pendientes.length > 0 && (
        <p className="rounded-xl border border-dashed border-outline-variant/60 px-4 py-8 text-center text-sm text-on-surface-variant">
          No hay ítems pendientes en esta categoría.
        </p>
      )}

      {comprados.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-card shadow-elevation-1">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 bg-surface-container-low/60 px-3 py-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <Check size={13} className="text-success" />
              Comprados ({comprados.length})
            </h3>
            <div className="flex items-center gap-2">
              {totalComprado > 0 && (
                <span className="text-[11px] font-semibold text-pebble">
                  {formatMonto(totalComprado)}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLimpiarAbierto(true)}
                disabled={pendiente}
              >
                <Trash2 size={13} />
                Limpiar
              </Button>
            </div>
          </header>
          <ul className="divide-y divide-outline-variant/25">
            {comprados.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2.5 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => comprado(item, false)}
                  disabled={pendiente}
                  aria-label={`Devolver ${item.nombre} a pendientes`}
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-on-success transition-colors hover:brightness-95 disabled:opacity-50"
                >
                  <Check size={13} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface-variant line-through">
                    {item.nombre}
                  </p>
                  <p className="text-[10px] text-pebble">
                    {formatearCantidad(item.cantidad, item.unidad)}
                  </p>
                </div>
                {item.precioCentavos !== null && (
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    {formatMonto(item.precioCentavos)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => eliminar(item)}
                  disabled={pendiente}
                  title="Eliminar ítem"
                  className="grid size-7 place-items-center rounded-full text-pebble transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-50"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {conPrecio > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-pebble">
          <CircleDollarSign size={12} />
          Los precios son los que cargaste a mano: no se consultan online.
        </p>
      )}

      <Dialogo
        abierto={nuevoAbierto}
        onOpenChange={setNuevoAbierto}
        titulo="Agregar a la lista"
        descripcion="Cargá lo que falta comprar. La categoría se sugiere por el nombre y la podés cambiar."
      >
        <FormularioLista
          pendiente={pendiente}
          onGuardar={guardar}
          onCancelar={() => setNuevoAbierto(false)}
        />
      </Dialogo>

      {editando && (
        <Dialogo
          abierto
          onOpenChange={(abierto) => {
            if (!abierto) setEditando(null);
          }}
          titulo="Editar ítem"
          descripcion={editando.nombre}
        >
          <FormularioLista
            key={editando.id}
            item={editando}
            pendiente={pendiente}
            onGuardar={guardar}
            onCancelar={() => setEditando(null)}
          />
        </Dialogo>
      )}

      <Dialogo
        abierto={limpiarAbierto}
        onOpenChange={setLimpiarAbierto}
        titulo="Eliminar comprados"
        descripcion={`Se van a borrar ${comprados.length} ítems ya marcados como comprados. El stock de la despensa no se modifica.`}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setLimpiarAbierto(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={limpiar} disabled={pendiente}>
            {pendiente && <Loader2 size={15} className="animate-spin" />}
            Limpiar
          </Button>
        </div>
      </Dialogo>
    </div>
  );
}
