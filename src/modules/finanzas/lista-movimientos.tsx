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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleCuentaChange("todas")}
            disabled={isPending}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              cuentaFiltro === "todas"
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
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
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  activo
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span>{c.nombre}</span>
              </button>
            );
          })}
        </div>

        {/* Filtro por tipo rápido */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {isPending && (
            <Loader2 size={13} className="animate-spin text-neutral-400" />
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleTipoChange("todos")}
              disabled={isPending}
              className={`px-2 py-0.5 rounded text-[11px] ${
                tipoFiltro === "todos"
                  ? "font-semibold text-neutral-900 underline"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Todos
            </button>
            <span className="text-neutral-300">·</span>
            <button
              type="button"
              onClick={() => handleTipoChange("ingreso")}
              disabled={isPending}
              className={`px-2 py-0.5 rounded text-[11px] ${
                tipoFiltro === "ingreso"
                  ? "font-semibold text-emerald-700 underline"
                  : "text-neutral-500 hover:text-emerald-700"
              }`}
            >
              Ingresos
            </button>
            <span className="text-neutral-300">·</span>
            <button
              type="button"
              onClick={() => handleTipoChange("gasto")}
              disabled={isPending}
              className={`px-2 py-0.5 rounded text-[11px] ${
                tipoFiltro === "gasto"
                  ? "font-semibold text-red-700 underline"
                  : "text-neutral-500 hover:text-red-700"
              }`}
            >
              Gastos
            </button>
            <span className="text-neutral-300">·</span>
            <button
              type="button"
              onClick={() => handleTipoChange("rendimiento")}
              disabled={isPending}
              className={`px-2 py-0.5 rounded text-[11px] ${
                tipoFiltro === "rendimiento"
                  ? "font-semibold text-emerald-700 underline"
                  : "text-neutral-500 hover:text-emerald-700"
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
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow-xs hover:bg-neutral-50 disabled:opacity-40"
          >
            <option value="todas">Todas las categorías</option>
            {categoriasDb.length > 0 ? (
              categoriasDb
                .filter((c: any) => !c.parentId)
                .map((padre: any) => {
                  const hijos = categoriasDb.filter((h: any) => h.parentId === padre.id);
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

          {/* Checkbox ocultar rendimientos */}
          <label
            className={`flex items-center gap-1.5 cursor-pointer select-none rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
              ocultarRendimientos
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            } ${tipoFiltro === "rendimiento" ? "opacity-40 pointer-events-none" : ""}`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={ocultarRendimientos}
              disabled={isPending || tipoFiltro === "rendimiento"}
              onChange={(e) => handleOcultarRendimientosChange(e.target.checked)}
            />
            <span
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition ${
                ocultarRendimientos
                  ? "border-white bg-transparent"
                  : "border-neutral-400 bg-white"
              }`}
            >
              {ocultarRendimientos && (
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                  <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            Ocultar rendimientos
          </label>
        </div>
      </div>

      {/* Lista de movimientos */}
      <ul
        className={`divide-y rounded-xl border bg-white shadow-xs overflow-hidden transition-opacity duration-150 ${
          isPending ? "opacity-60" : "opacity-100"
        }`}
      >
        {data.items.length === 0 ? (
          <li className="p-8 text-center text-sm text-neutral-500">
            No hay movimientos registrados para este filtro o página.
          </li>
        ) : (
          data.items.map((m) => {
            const esRendimiento = m.categoria === "Rendimientos";
            const esTransferencia = m.categoria === "Transferencia";

            const catDb = categoriasDb.find((c: any) => c.nombre === m.categoria);

            return (
              <li
                key={m.id}
                className={`flex items-center gap-3 p-3 transition hover:bg-neutral-50/60 ${
                  esRendimiento ? "bg-emerald-50/30" : ""
                }`}
              >
                {/* Icono de categoría/tipo */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    esRendimiento
                      ? "bg-emerald-100 text-emerald-700"
                      : esTransferencia
                      ? "bg-sky-100 text-sky-700"
                      : m.tipo === "ingreso"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {esRendimiento ? (
                    <TrendingUp size={16} />
                  ) : esTransferencia ? (
                    <ArrowRightLeft size={16} />
                  ) : catDb ? (
                    <CategoriaIcon icono={catDb.icono} size={16} />
                  ) : m.tipo === "ingreso" ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </div>

                {/* Detalle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {m.descripcion || m.categoria}
                    </p>
                    {esRendimiento && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <Sparkles size={10} />
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {/* Badge de cuenta */}
                    {m.cuentaNombre && (
                      <span className="inline-flex items-center gap-1 font-medium text-neutral-700">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: m.cuentaColor ?? "#3b82f6",
                          }}
                        />
                        {m.cuentaNombre}
                      </span>
                    )}
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      {catDb && <CategoriaIcon icono={catDb.icono} size={12} />}
                      <span>{m.categoria}</span>
                    </span>
                    <span>·</span>
                    <span>{m.fecha}</span>
                  </div>
                </div>

                {/* Monto */}
                <div className="text-right">
                  <span
                    className={`text-sm font-semibold ${
                      m.tipo === "ingreso"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {m.tipo === "ingreso" ? "+ " : "− "}
                    {formatMonto(m.monto)}
                  </span>
                </div>

                {/* Acciones: Editar y Borrar */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMovimientoAEditar(m)}
                    aria-label="Editar movimiento"
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
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
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-600 transition"
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

      {/* Barra de paginación */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 px-1 text-xs text-neutral-500">
        <div>
          {data.total > 0 ? (
            <p>
              Mostrando{" "}
              <span className="font-semibold text-neutral-800">
                {(data.pagina - 1) * data.limite + 1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-neutral-800">
                {Math.min(data.pagina * data.limite, data.total)}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-neutral-800">
                {data.total}
              </span>{" "}
              movimientos
            </p>
          ) : (
            <p>0 movimientos encontrados</p>
          )}
        </div>

        {data.totalPaginas > 1 && (
          <div className="flex items-center gap-1">
            {/* Botón Anterior */}
            <button
              type="button"
              onClick={() => cargarPagina(data.pagina - 1)}
              disabled={data.pagina <= 1 || isPending}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-xs transition hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1 px-1">
              {paginasVisibles.map((p, idx) => {
                if (p === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-neutral-400"
                    >
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
                    className={`min-w-7 h-7 rounded-lg text-xs font-medium transition ${
                      esActiva
                        ? "bg-neutral-900 text-white shadow-xs font-semibold"
                        : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Botón Siguiente */}
            <button
              type="button"
              onClick={() => cargarPagina(data.pagina + 1)}
              disabled={data.pagina >= data.totalPaginas || isPending}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-xs transition hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal para editar movimiento */}
      {movimientoAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-semibold text-neutral-900">
                Editar Transacción
              </h3>
              <button
                type="button"
                onClick={() => setMovimientoAEditar(null)}
                className="text-neutral-400 hover:text-neutral-600 rounded p-1"
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
                <span className="text-xs font-medium text-neutral-600">
                  Cuenta
                </span>
                <select
                  name="cuentaId"
                  defaultValue={movimientoAEditar.cuentaId ?? cuentas[0]?.id}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                >
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({formatMonto(c.saldo)})
                    </option>
                  ))}
                </select>
              </label>

              {/* Tipo y Monto */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-neutral-600">
                    Tipo
                  </span>
                  <select
                    name="tipo"
                    defaultValue={movimientoAEditar.tipo}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-neutral-600">
                    Monto ($)
                  </span>
                  <input
                    name="monto"
                    inputMode="decimal"
                    required
                    defaultValue={(
                      movimientoAEditar.monto / 100
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </label>
              </div>

              {/* Categoría y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-neutral-600">
                    Categoría
                  </span>
                  <select
                    name="categoria"
                    defaultValue={movimientoAEditar.categoria}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {categoriasDb.length > 0 ? (
                      categoriasDb
                        .filter((c: any) => !c.parentId)
                        .flatMap((padre: any) => {
                          const hijos = categoriasDb.filter((h: any) => h.parentId === padre.id);
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
                    {!categoriasDb.some((c: any) => c.nombre === movimientoAEditar.categoria) && (
                      <option value={movimientoAEditar.categoria}>{movimientoAEditar.categoria}</option>
                    )}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-neutral-600">
                    Fecha
                  </span>
                  <input
                    type="date"
                    name="fecha"
                    defaultValue={movimientoAEditar.fecha}
                    required
                    className="w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </label>
              </div>

              {/* Descripción */}
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-600">
                  Descripción (opcional)
                </span>
                <input
                  name="descripcion"
                  defaultValue={movimientoAEditar.descripcion ?? ""}
                  placeholder="ej. Supermercado, Factura de luz, etc."
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMovimientoAEditar(null)}
                  className="rounded-lg border px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition"
                >
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
