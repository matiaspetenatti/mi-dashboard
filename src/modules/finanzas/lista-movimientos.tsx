"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import {
  Trash2,
  TrendingUp,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  borrarMovimiento,
  actualizarMovimiento,
  obtenerMovimientosPaginadosAction,
} from "./actions";
import { formatMonto } from "@/lib/format";
import { categorias } from "./categorias";
import type {
  CuentaConSaldo,
  MovimientoItem,
  MovimientosPaginadosResult,
} from "./queries";
import { getCategoriasFinanzas } from "./queries";
import { CategoriaIcon } from "./iconos-categorias";

const entrada =
  "w-full rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-pebble focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const etiqueta = "text-xs font-medium text-charcoal";
const botonPrimario =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90";
const botonSecundario =
  "inline-flex items-center justify-center rounded-full border border-outline-variant/60 px-4 py-2 text-sm font-medium text-charcoal transition hover:bg-surface-container";
const chipActivo =
  "bg-inverse-surface font-bold text-inverse-on-surface";
const chipInactivo =
  "border border-outline-variant/60 bg-card text-charcoal hover:bg-surface-container";

function generarPaginasVisibles(
  actual: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (actual <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (actual >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", actual - 1, actual, actual + 1, "...", total];
}

function parseCategoriaFiltro(valor: string): {
  categoria?: string;
  categoriaPadre?: string;
} {
  if (valor === "todas") return {};
  if (valor.startsWith("padre:")) {
    return { categoriaPadre: valor.slice("padre:".length) };
  }
  if (valor.startsWith("categoria:")) {
    return { categoria: valor.slice("categoria:".length) };
  }
  // Compatibilidad con categorías sin prefijo (fallback estático)
  return { categoria: valor };
}

export function ListaMovimientos({
  initialData,
  cuentas,
}: {
  initialData: MovimientosPaginadosResult;
  cuentas: CuentaConSaldo[];
}) {
  const [data, setData] = useState<MovimientosPaginadosResult>(initialData);
  const [cuentaFiltro, setCuentaFiltro] = useState<number | "todas">("todas");
  const [tipoFiltro, setTipoFiltro] = useState<
    "todos" | "ingreso" | "gasto" | "rendimiento"
  >("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [ocultarRendimientos, setOcultarRendimientos] = useState(true);
  const [movimientoAEditar, setMovimientoAEditar] =
    useState<MovimientoItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const cargarPagina = (
    nuevaPagina: number,
    nuevaCuenta = cuentaFiltro,
    nuevoTipo = tipoFiltro,
    nuevoOcultarRendimientos = ocultarRendimientos,
    nuevaCategoria = categoriaFiltro
  ) => {
    startTransition(async () => {
      const filtroCategoria = parseCategoriaFiltro(nuevaCategoria);
      const res = await obtenerMovimientosPaginadosAction({
        pagina: nuevaPagina,
        limite: 10,
        cuentaId: nuevaCuenta === "todas" ? undefined : nuevaCuenta,
        tipo: nuevoTipo === "todos" ? undefined : nuevoTipo,
        categoria: filtroCategoria.categoria,
        categoriaPadre: filtroCategoria.categoriaPadre,
        ocultarRendimientos: nuevoOcultarRendimientos,
      });
      setData(res);
    });
  };

  const handleCuentaChange = (cId: number | "todas") => {
    setCuentaFiltro(cId);
    cargarPagina(1, cId, tipoFiltro, ocultarRendimientos, categoriaFiltro);
  };

  const handleTipoChange = (
    t: "todos" | "ingreso" | "gasto" | "rendimiento"
  ) => {
    setTipoFiltro(t);
    cargarPagina(1, cuentaFiltro, t, ocultarRendimientos, categoriaFiltro);
  };

  const handleCategoriaChange = (cat: string) => {
    setCategoriaFiltro(cat);
    cargarPagina(1, cuentaFiltro, tipoFiltro, ocultarRendimientos, cat);
  };

  const handleOcultarRendimientosChange = (checked: boolean) => {
    setOcultarRendimientos(checked);
    cargarPagina(1, cuentaFiltro, tipoFiltro, checked, categoriaFiltro);
  };

  const paginasVisibles = useMemo(
    () => generarPaginasVisibles(data.pagina, data.totalPaginas),
    [data.pagina, data.totalPaginas]
  );
  const [categoriasDb, setCategoriasDb] = useState<any[]>([]);

  useEffect(() => {
    getCategoriasFinanzas().then((rows) => setCategoriasDb(rows));
  }, []);

  return (
    <div className="space-y-3">
      {/* Filtros de cuentas y tipos */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleCuentaChange("todas")}
            disabled={isPending}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              cuentaFiltro === "todas" ? chipActivo : chipInactivo
            }`}
          >
            Todas las cuentas
          </button>
          {cuentas.map((c) => {
            const activo = cuentaFiltro === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCuentaChange(c.id)}
                disabled={isPending}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                  activo ? chipActivo : chipInactivo
                }`}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span>{c.nombre}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isPending && (
            <Loader2 size={13} className="animate-spin text-pebble" />
          )}

          {/* Filtro por tipo */}
          <div className="inline-flex rounded-full border border-outline-variant/60 bg-surface-container p-0.5">
            <button
              type="button"
              onClick={() => handleTipoChange("todos")}
              disabled={isPending}
              className={`rounded-full px-2.5 py-1 transition ${
                tipoFiltro === "todos"
                  ? "bg-card font-bold text-heading shadow-xs"
                  : "text-charcoal hover:text-heading"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange("ingreso")}
              disabled={isPending}
              className={`rounded-full px-2.5 py-1 transition ${
                tipoFiltro === "ingreso"
                  ? "bg-card font-bold text-success shadow-xs"
                  : "text-charcoal hover:text-success"
              }`}
            >
              Ingresos
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange("gasto")}
              disabled={isPending}
              className={`rounded-full px-2.5 py-1 transition ${
                tipoFiltro === "gasto"
                  ? "bg-card font-bold text-error shadow-xs"
                  : "text-charcoal hover:text-error"
              }`}
            >
              Gastos
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange("rendimiento")}
              disabled={isPending}
              className={`rounded-full px-2.5 py-1 transition ${
                tipoFiltro === "rendimiento"
                  ? "bg-card font-bold text-success shadow-xs"
                  : "text-charcoal hover:text-success"
              }`}
            >
              Rendimientos
            </button>
          </div>

          {/* Filtro por categoría */}
          <select
            value={categoriaFiltro}
            onChange={(e) => handleCategoriaChange(e.target.value)}
            disabled={isPending}
            aria-label="Filtrar por categoría"
            className="rounded-full border border-outline-variant/60 bg-card px-3 py-1 text-xs font-medium text-charcoal hover:bg-surface-container disabled:opacity-40"
          >
            <option value="todas">Todas las categorías</option>
            {categoriasDb.length > 0 ? (
              categoriasDb
                .filter((c: any) => !c.parentId)
                .map((padre: any) => {
                  const hijos = categoriasDb.filter(
                    (h: any) => h.parentId === padre.id
                  );
                  if (hijos.length === 0) {
                    return (
                      <option key={padre.nombre} value={`categoria:${padre.nombre}`}>
                        {padre.nombre}
                      </option>
                    );
                  }
                  return [
                    <option key={`${padre.nombre}-todas`} value={`padre:${padre.nombre}`}>
                      {`${padre.nombre} (todas)`}
                    </option>,
                    ...hijos.map((h: any) => (
                      <option key={h.nombre} value={`categoria:${h.nombre}`}>
                        {`  └ ${h.nombre}`}
                      </option>
                    )),
                  ];
                })
            ) : (
              categorias.map((cat) => (
                <option key={cat} value={`categoria:${cat}`}>
                  {cat}
                </option>
              ))
            )}
          </select>

          {/* Ocultar rendimientos */}
          <label
            className={`flex cursor-pointer select-none items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              ocultarRendimientos
                ? "bg-inverse-surface text-inverse-on-surface"
                : `bg-card ${chipInactivo}`
            } ${tipoFiltro === "rendimiento" ? "pointer-events-none opacity-40" : ""}`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={ocultarRendimientos}
              disabled={isPending || tipoFiltro === "rendimiento"}
              onChange={(e) => handleOcultarRendimientosChange(e.target.checked)}
            />
            <span
              className={`flex size-3.5 shrink-0 items-center justify-center rounded border transition ${
                ocultarRendimientos
                  ? "border-current"
                  : "border-outline bg-transparent"
              }`}
            >
              {ocultarRendimientos && (
                <svg viewBox="0 0 10 10" className="size-2.5" fill="none">
                  <polyline
                    points="1.5,5 4,7.5 8.5,2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            Ocultar rendimientos
          </label>
        </div>
      </div>

      {/* Lista */}
      <ul
        className={`divide-y divide-outline-variant/40 overflow-hidden rounded-xl border border-outline-variant/60 bg-card shadow-elevation-1 transition-opacity duration-150 ${
          isPending ? "opacity-60" : "opacity-100"
        }`}
      >
        {data.items.length === 0 ? (
          <li className="px-6 py-10 text-center text-sm text-charcoal">
            No hay movimientos registrados para este filtro o página.
          </li>
        ) : (
          data.items.map((m) => {
            const esRendimiento = m.categoria === "Rendimientos";
            const esTransferencia = m.categoria === "Transferencia";

            const catDb = categoriasDb.find(
              (c: any) => c.nombre === m.categoria
            );

            return (
              <li
                key={m.id}
                className={`flex items-center gap-3 p-3.5 transition hover:bg-surface-container-low/60 ${
                  esRendimiento ? "bg-success-container/30" : ""
                }`}
              >
                {/* Ícono */}
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    esRendimiento
                      ? "bg-success-container text-on-success-container"
                      : esTransferencia
                        ? "bg-signal-blue/10 text-signal-blue"
                        : m.tipo === "ingreso"
                          ? "bg-success-container text-success"
                          : "bg-error-container text-error"
                  }`}
                >
                  {esRendimiento ? (
                    <TrendingUp size={15} />
                  ) : esTransferencia ? (
                    <ArrowRightLeft size={15} />
                  ) : catDb ? (
                    <CategoriaIcon icono={catDb.icono} size={15} />
                  ) : m.tipo === "ingreso" ? (
                    <ArrowUpRight size={15} />
                  ) : (
                    <ArrowDownRight size={15} />
                  )}
                </span>

                {/* Detalle */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-heading">
                      {m.descripcion || m.categoria}
                    </p>
                    {esRendimiento && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success-container px-1.5 py-0.5 text-[10px] font-bold text-on-success-container">
                        <Sparkles size={10} />
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-charcoal">
                    {m.cuentaNombre && (
                      <span className="inline-flex items-center gap-1 font-medium">
                        <span
                          className="size-1.5 rounded-full"
                          style={{
                            backgroundColor: m.cuentaColor ?? "#3b82f6",
                          }}
                        />
                        {m.cuentaNombre}
                      </span>
                    )}
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      {catDb && <CategoriaIcon icono={catDb.icono} size={11} />}
                      <span>{m.categoria}</span>
                    </span>
                    <span>·</span>
                    <span>{m.fecha}</span>
                  </div>
                </div>

                {/* Monto */}
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    m.tipo === "ingreso" ? "text-success" : "text-error"
                  }`}
                >
                  {m.tipo === "ingreso" ? "+ " : "− "}
                  {formatMonto(m.monto)}
                </span>

                {/* Acciones */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMovimientoAEditar(m)}
                    aria-label="Editar movimiento"
                    className="rounded-md p-1 text-pebble transition hover:bg-surface-container hover:text-charcoal"
                    title="Editar movimiento"
                  >
                    <Pencil size={15} />
                  </button>
                  <form
                    action={async () => {
                      await borrarMovimiento(m.id);
                      cargarPagina(data.pagina);
                    }}
                  >
                    <button
                      type="submit"
                      aria-label="Borrar movimiento"
                      className="rounded-md p-1 text-pebble transition hover:bg-error-container/60 hover:text-error"
                      title="Borrar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </form>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* Paginación */}
      <div className="flex flex-col items-center justify-between gap-3 px-1 pt-1 text-xs text-charcoal sm:flex-row">
        <div>
          {data.total > 0 ? (
            <p>
              Mostrando{" "}
              <span className="font-semibold text-heading">
                {(data.pagina - 1) * data.limite + 1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-heading">
                {Math.min(data.pagina * data.limite, data.total)}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-heading">{data.total}</span>{" "}
              movimientos
            </p>
          ) : (
            <p>0 movimientos encontrados</p>
          )}
        </div>

        {data.totalPaginas > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => cargarPagina(data.pagina - 1)}
              disabled={data.pagina <= 1 || isPending}
              className="flex items-center gap-1 rounded-full border border-outline-variant/60 bg-card px-2.5 py-1 text-xs font-medium text-charcoal transition hover:bg-surface-container disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {paginasVisibles.map((p, idx) => {
                if (p === "...") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-pebble">
                      …
                    </span>
                  );
                }
                const num = p as number;
                const esActiva = num === data.pagina;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => cargarPagina(num)}
                    disabled={isPending}
                    aria-current={esActiva ? "page" : undefined}
                    className={`min-w-7 rounded-full px-1.5 py-1 text-xs font-medium transition ${
                      esActiva
                        ? "bg-inverse-surface font-semibold text-inverse-on-surface shadow-xs"
                        : "border border-outline-variant/60 bg-card text-charcoal hover:bg-surface-container"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => cargarPagina(data.pagina + 1)}
              disabled={data.pagina >= data.totalPaginas || isPending}
              className="flex items-center gap-1 rounded-full border border-outline-variant/60 bg-card px-2.5 py-1 text-xs font-medium text-charcoal transition hover:bg-surface-container disabled:pointer-events-none disabled:opacity-40"
            >
              <span>Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal: editar movimiento */}
      {movimientoAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-outline-variant/60 bg-card p-6 shadow-elevation-4">
            <div className="flex items-center justify-between gap-3 border-b border-outline-variant/50 pb-3">
              <h3 className="text-base font-semibold text-heading">
                Editar Transacción
              </h3>
              <button
                type="button"
                onClick={() => setMovimientoAEditar(null)}
                className="rounded-md p-1 text-pebble transition hover:bg-surface-container hover:text-charcoal"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form
              action={async (formData) => {
                await actualizarMovimiento(formData);
                setMovimientoAEditar(null);
                cargarPagina(data.pagina);
              }}
              className="mt-4 space-y-4"
            >
              <input type="hidden" name="id" value={movimientoAEditar.id} />

              {/* Cuenta */}
              <label className="block space-y-1">
                <span className={etiqueta}>Cuenta</span>
                <select
                  name="cuentaId"
                  defaultValue={movimientoAEditar.cuentaId ?? cuentas[0]?.id}
                  className={entrada}
                  required
                >
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({formatMonto(c.saldo)})
                    </option>
                  ))}
                </select>
              </label>

              {/* Tipo y monto */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className={etiqueta}>Tipo</span>
                  <select
                    name="tipo"
                    defaultValue={movimientoAEditar.tipo}
                    className={entrada}
                  >
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className={etiqueta}>Monto ($)</span>
                  <input
                    name="monto"
                    inputMode="decimal"
                    required
                    defaultValue={(movimientoAEditar.monto / 100).toLocaleString(
                      "es-AR",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                    className={entrada}
                  />
                </label>
              </div>

              {/* Categoría y fecha */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className={etiqueta}>Categoría</span>
                  <select
                    name="categoria"
                    defaultValue={movimientoAEditar.categoria}
                    className={entrada}
                  >
                    {categoriasDb.length > 0 ? (
                      categoriasDb
                        .filter((c: any) => !c.parentId)
                        .flatMap((padre: any) => {
                          const hijos = categoriasDb.filter(
                            (h: any) => h.parentId === padre.id
                          );
                          const items = [
                            <option key={padre.nombre} value={padre.nombre}>
                              {padre.nombre}
                            </option>,
                          ];
                          if (hijos.length > 0) {
                            items.push(
                              ...hijos.map((h: any) => (
                                <option key={h.nombre} value={h.nombre}>
                                  {`  └ ${h.nombre}`}
                                </option>
                              ))
                            );
                          }
                          return items;
                        })
                    ) : (
                      categorias.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    )}
                    {!categoriasDb.some(
                      (c: any) => c.nombre === movimientoAEditar.categoria
                    ) && (
                      <option value={movimientoAEditar.categoria}>
                        {movimientoAEditar.categoria}
                      </option>
                    )}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className={etiqueta}>Fecha</span>
                  <input
                    type="date"
                    name="fecha"
                    defaultValue={movimientoAEditar.fecha}
                    required
                    className={entrada}
                  />
                </label>
              </div>

              {/* Descripción */}
              <label className="block space-y-1">
                <span className={etiqueta}>Descripción (opcional)</span>
                <input
                  name="descripcion"
                  defaultValue={movimientoAEditar.descripcion ?? ""}
                  placeholder="ej. Supermercado, Factura de luz, etc."
                  className={entrada}
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMovimientoAEditar(null)}
                  className={botonSecundario}
                >
                  Cancelar
                </button>
                <button type="submit" className={botonPrimario}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
