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

  // En gastos, si la diferencia es positiva gastó MÁS (desalerta), si es negativa gastó MENOS (ahorro)
  const gastoMas = diferencia > 0;
  const gastoMenos = diferencia < 0;
  const sinCambio = diferencia === 0;

  // Escala para las barras de comparación
  const maxTotal = Math.max(totalActual, totalAnterior, 1);
  const porcentajeBarraActual = Math.round((totalActual / maxTotal) * 100);
  const porcentajeBarraAnterior = Math.round((totalAnterior / maxTotal) * 100);
  const hayFacturas = itemsActual.length > 0 || itemsAnterior.length > 0;

  return (
    <section className="space-y-5 rounded-xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning-container text-warning">
            <Receipt size={16} />
          </span>
          <div>
            <h2 className="text-base font-bold leading-tight text-heading">
              Comparativa de Gastos en Servicios
            </h2>
            <p className="text-xs text-charcoal">
              Comparación de facturas y servicios entre {mesAnteriorNombre} y{" "}
              {mesActualNombre}
            </p>
          </div>
        </div>

        {/* Badge de variación */}
        <span className="self-start">
          {gastoMas && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-error/25 bg-error-container px-3 py-1 text-xs font-bold text-on-error-container">
              <ArrowUpRight size={14} />
              +{formatMonto(diferencia)} (+{porcentaje}%)
            </span>
          )}
          {gastoMenos && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-container px-3 py-1 text-xs font-bold text-on-success-container">
              <ArrowDownRight size={14} />
              Ahorro: −{formatMonto(Math.abs(diferencia))} ({porcentaje}%)
            </span>
          )}
          {sinCambio && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container px-3 py-1 text-xs font-bold text-charcoal">
              <Minus size={14} />
              Sin variación (0%)
            </span>
          )}
        </span>
      </div>

      {/* Mes anterior vs actual */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-4">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-charcoal">
            <span>Mes anterior ({mesAnteriorNombre})</span>
            <span className="font-medium">
              {itemsAnterior.length}{" "}
              {itemsAnterior.length === 1 ? "factura" : "facturas"}
            </span>
          </div>
          <p className="text-xl font-bold tracking-tight text-heading">
            {formatMonto(totalAnterior)}
          </p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full rounded-full bg-outline transition-all duration-500"
              style={{ width: `${porcentajeBarraAnterior}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-4">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-charcoal">
            <span>Mes actual ({mesActualNombre})</span>
            <span className="font-medium">
              {itemsActual.length}{" "}
              {itemsActual.length === 1 ? "factura" : "facturas"}
            </span>
          </div>
          <p
            className={`text-xl font-bold tracking-tight ${
              gastoMas
                ? "text-error"
                : gastoMenos
                  ? "text-success"
                  : "text-heading"
            }`}
          >
            {formatMonto(totalActual)}
          </p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                gastoMas
                  ? "bg-error"
                  : gastoMenos
                    ? "bg-success"
                    : "bg-primary"
              }`}
              style={{ width: `${porcentajeBarraActual}%` }}
            />
          </div>
        </div>
      </div>

      {/* Comparativa por servicio */}
      {porServicio.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-outline-variant/50 text-[11px] font-bold uppercase tracking-wider text-pebble">
                <th className="py-2.5 pr-3 font-semibold">
                  Comparativa por Servicio
                </th>
                <th className="py-2.5 pl-3 text-right font-semibold">
                  {mesAnteriorNombre}
                </th>
                <th className="py-2.5 pl-3 text-right font-semibold">
                  {mesActualNombre}
                </th>
                <th className="py-2.5 pl-3 text-right font-semibold">
                  Variación
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {porServicio.map((servicio) => {
                const mas = servicio.diferencia > 0;
                const menos = servicio.diferencia < 0;
                return (
                  <tr key={servicio.categoria}>
                    <td className="py-3 pr-3 font-semibold text-heading">
                      {servicio.categoria}
                    </td>
                    <td className="py-3 pl-3 text-right font-medium tabular-nums text-charcoal">
                      {formatMonto(servicio.totalAnterior)}
                    </td>
                    <td className="py-3 pl-3 text-right font-bold tabular-nums text-heading">
                      {formatMonto(servicio.totalActual)}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      {mas && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold text-on-error-container">
                          <ArrowUpRight size={11} />
                          {servicio.porcentaje === null
                            ? "Nuevo"
                            : `+${servicio.porcentaje}%`}
                        </span>
                      )}
                      {menos && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-success-container px-2 py-0.5 text-[10px] font-bold text-on-success-container">
                          <ArrowDownRight size={11} />
                          {servicio.porcentaje === null
                            ? "−"
                            : `${servicio.porcentaje}%`}
                        </span>
                      )}
                      {!mas && !menos && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium text-charcoal">
                          <Minus size={11} />
                          Sin cambio
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-outline-variant/60 bg-surface-container-low/60 px-4 py-6 text-center text-xs text-charcoal">
          No hay servicios registrados en {mesAnteriorNombre} ni en{" "}
          {mesActualNombre}. Cuando cargues una factura vas a ver la comparación
          acá.
        </div>
      )}

      {/* Resumen explicativo */}
      <div className="flex items-center justify-between gap-3 border-t border-outline-variant/50 pt-3 text-xs text-charcoal">
        <p className="min-w-0">
          {gastoMas && (
            <>
              Gastaste{" "}
              <strong className="font-semibold text-error">
                {formatMonto(diferencia)} más
              </strong>{" "}
              en servicios este mes en comparación con {mesAnteriorNombre}.
            </>
          )}
          {gastoMenos && (
            <>
              Ahorraste{" "}
              <strong className="font-semibold text-heading">
                {formatMonto(Math.abs(diferencia))}
              </strong>{" "}
              en servicios en comparación con {mesAnteriorNombre}.
            </>
          )}
          {sinCambio && (
            <>
              Tus gastos en servicios están igualados respecto a{" "}
              {mesAnteriorNombre}.
            </>
          )}
        </p>

        {hayFacturas && (
          <button
            type="button"
            onClick={() => setMostrarDetalle(!mostrarDetalle)}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-heading transition-colors hover:underline"
          >
            {mostrarDetalle ? "Ocultar desglose" : "Ver desglose"}
            {mostrarDetalle ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Desglose de facturas */}
      {mostrarDetalle && (
        <div className="grid gap-4 border-t border-outline-variant/50 pt-4 sm:grid-cols-2">
          <DetalleMes
            titulo={`Servicios en ${mesAnteriorNombre}`}
            mesNombre={mesAnteriorNombre}
            items={itemsAnterior}
            tono="neutro"
          />
          <DetalleMes
            titulo={`Servicios en ${mesActualNombre}`}
            mesNombre={mesActualNombre}
            items={itemsActual}
            tono="gasto"
          />
        </div>
      )}
    </section>
  );
}

function DetalleMes({
  titulo,
  mesNombre,
  items,
  tono,
}: {
  titulo: string;
  mesNombre: string;
  items: ComparativaServiciosData["itemsActual"];
  tono: "neutro" | "gasto";
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-pebble">
        {titulo}
      </h3>
      {items.length === 0 ? (
        <p className="py-2 text-xs italic text-pebble">
          Sin movimientos de servicios registrados en {mesNombre}.
        </p>
      ) : (
        <ul className="divide-y divide-outline-variant/40 overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-low/60 text-xs">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 p-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-heading">
                  {item.descripcion || "Servicio"}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-charcoal">
                  <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[10px] font-medium text-charcoal">
                    {item.categoria}
                  </span>
                  {item.cuentaNombre && (
                    <span className="flex items-center gap-1">
                      <span
                        className="size-1.5 rounded-full"
                        style={{
                          backgroundColor: item.cuentaColor ?? "#3b82f6",
                        }}
                      />
                      {item.cuentaNombre}
                    </span>
                  )}
                  <span>·</span>
                  <span>{item.fecha}</span>
                </div>
              </div>
              <span
                className={`shrink-0 font-bold ${
                  tono === "gasto" ? "text-error" : "text-charcoal"
                }`}
              >
                {formatMonto(item.monto)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
