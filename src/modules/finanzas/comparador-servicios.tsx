"use client";

import { useState } from "react";
import {
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatMonto } from "@/lib/format";
import type { ComparativaServiciosData } from "./queries";

export function ComparadorServicios({
  datos,
}: {
  datos: ComparativaServiciosData;
}) {
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const {
    mesActualNombre,
    totalActual,
    itemsActual,
    mesAnteriorNombre,
    totalAnterior,
    itemsAnterior,
    diferencia,
    porcentaje,
    porServicio,
  } = datos;

  // En gastos, si la diferencia es positiva gastó MÁS (desfavorable/alerta), si es negativa gastó MENOS (ahorro)
  const gastoMas = diferencia > 0;
  const gastoMenos = diferencia < 0;
  const sinCambio = diferencia === 0;

  // Cálculo para barra de comparación visual proporcional
  const maxTotal = Math.max(totalActual, totalAnterior, 1);
  const porcentajeBarraActual = Math.round((totalActual / maxTotal) * 100);
  const porcentajeBarraAnterior = Math.round((totalAnterior / maxTotal) * 100);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-xs transition">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Receipt size={15} />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              Comparativa de Gastos en Servicios
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            Comparación de facturas y servicios entre {mesAnteriorNombre} y {mesActualNombre}
          </p>
        </div>

        {/* Badge de variación */}
        <div className="self-start sm:self-auto">
          {gastoMas && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
              <ArrowUpRight size={14} />
              <span>
                +{formatMonto(diferencia)} (+{porcentaje}%)
              </span>
            </div>
          )}
          {gastoMenos && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ArrowDownRight size={14} />
              <span>
                Ahorro: −{formatMonto(Math.abs(diferencia))} ({porcentaje}%)
              </span>
            </div>
          )}
          {sinCambio && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700">
              <Minus size={14} />
              <span>Sin variación (0%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas comparativas del mes anterior vs actual */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Mes Anterior */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-medium">Mes anterior ({mesAnteriorNombre})</span>
            <span className="text-[11px] font-normal">
              {itemsAnterior.length} {itemsAnterior.length === 1 ? "factura" : "facturas"}
            </span>
          </div>
          <p className="mt-1 text-xl font-bold text-neutral-800">
            {formatMonto(totalAnterior)}
          </p>
          {/* Barra de progreso */}
          <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-neutral-400 transition-all duration-500"
              style={{ width: `${porcentajeBarraAnterior}%` }}
            />
          </div>
        </div>

        {/* Mes Actual */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-medium">Mes actual ({mesActualNombre})</span>
            <span className="text-[11px] font-normal">
              {itemsActual.length} {itemsActual.length === 1 ? "factura" : "facturas"}
            </span>
          </div>
          <p
            className={`mt-1 text-xl font-bold ${
              gastoMas
                ? "text-red-600"
                : gastoMenos
                ? "text-emerald-600"
                : "text-neutral-900"
            }`}
          >
            {formatMonto(totalActual)}
          </p>
          {/* Barra de progreso */}
          <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                gastoMas
                  ? "bg-red-500"
                  : gastoMenos
                  ? "bg-emerald-500"
                  : "bg-neutral-900"
              }`}
              style={{ width: `${porcentajeBarraActual}%` }}
            />
          </div>
        </div>
      </div>

      {/* Comparativa por subcategoría / servicio */}
      {porServicio.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between gap-2 border-b bg-neutral-50/60 px-3 py-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Comparativa por servicio
            </h4>
            <div className="hidden shrink-0 items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-neutral-400 sm:flex">
              <span className="w-20 text-right">{mesAnteriorNombre}</span>
              <span className="w-20 text-right">{mesActualNombre}</span>
              <span className="w-24 text-right">Variación</span>
            </div>
          </div>
          <ul className="divide-y text-xs">
            {porServicio.map((servicio) => {
              const mas = servicio.diferencia > 0;
              const menos = servicio.diferencia < 0;
              return (
                <li
                  key={servicio.categoria}
                  className="flex items-center gap-2 px-3 py-2 transition hover:bg-neutral-50/60"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-neutral-800">
                    {servicio.categoria}
                  </span>
                  <span className="w-20 shrink-0 text-right tabular-nums text-neutral-500">
                    {formatMonto(servicio.totalAnterior)}
                  </span>
                  <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-neutral-900">
                    {formatMonto(servicio.totalActual)}
                  </span>
                  <span className="flex w-24 shrink-0 justify-end">
                    {mas && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        <ArrowUpRight size={11} />
                        {servicio.porcentaje === null
                          ? "Nuevo"
                          : `+${servicio.porcentaje}%`}
                      </span>
                    )}
                    {menos && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <ArrowDownRight size={11} />
                        {servicio.porcentaje === null
                          ? "−"
                          : `${servicio.porcentaje}%`}
                      </span>
                    )}
                    {!mas && !menos && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                        <Minus size={11} />
                        Sin cambio
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Resumen explicativo */}
      <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 flex items-center justify-between">
        <div>
          {gastoMas && (
            <span>
              Gastaste <strong className="text-red-700">{formatMonto(diferencia)} más</strong> en servicios este mes en comparación con {mesAnteriorNombre}.
            </span>
          )}
          {gastoMenos && (
            <span>
              Ahorraste <strong className="text-emerald-700">{formatMonto(Math.abs(diferencia))}</strong> en servicios en comparación con {mesAnteriorNombre}.
            </span>
          )}
          {sinCambio && (
            <span>
              Tus gastos en servicios están igualados respecto al mes anterior.
            </span>
          )}
        </div>

        {(itemsActual.length > 0 || itemsAnterior.length > 0) && (
          <button
            type="button"
            onClick={() => setMostrarDetalle(!mostrarDetalle)}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-800 hover:text-neutral-950 transition ml-2 shrink-0"
          >
            <span>{mostrarDetalle ? "Ocultar desglose" : "Ver desglose"}</span>
            {mostrarDetalle ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Desglose de facturas / movimientos de servicios */}
      {mostrarDetalle && (
        <div className="mt-4 border-t pt-4 grid gap-4 sm:grid-cols-2">
          {/* Detalle mes anterior */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Servicios en {mesAnteriorNombre}
            </h4>
            {itemsAnterior.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-2">
                Sin movimientos de servicios registrados en {mesAnteriorNombre}.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border bg-white overflow-hidden text-xs">
                {itemsAnterior.map((item) => (
                  <li key={item.id} className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-800 truncate">
                        {item.descripcion || "Servicio"}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                          {item.categoria}
                        </span>
                        {item.cuentaNombre && (
                          <span className="flex items-center gap-1">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: item.cuentaColor ?? "#3b82f6" }}
                            />
                            {item.cuentaNombre}
                          </span>
                        )}
                        <span>·</span>
                        <span>{item.fecha}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-neutral-700 shrink-0">
                      {formatMonto(item.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detalle mes actual */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Servicios en {mesActualNombre}
            </h4>
            {itemsActual.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-2">
                Sin movimientos de servicios registrados en {mesActualNombre}.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border bg-white overflow-hidden text-xs">
                {itemsActual.map((item) => (
                  <li key={item.id} className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-800 truncate">
                        {item.descripcion || "Servicio"}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
                        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                          {item.categoria}
                        </span>
                        {item.cuentaNombre && (
                          <span className="flex items-center gap-1">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: item.cuentaColor ?? "#3b82f6" }}
                            />
                            {item.cuentaNombre}
                          </span>
                        )}
                        <span>·</span>
                        <span>{item.fecha}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-red-600 shrink-0">
                      {formatMonto(item.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
