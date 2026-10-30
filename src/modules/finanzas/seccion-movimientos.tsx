"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, PlusCircle, Settings } from "lucide-react";
import { OperacionesForm } from "./operaciones-form";
import { ListaMovimientos } from "./lista-movimientos";
import { GestionarCategoriasModal } from "./gestionar-categorias-modal";
import type { CuentaConSaldo, MovimientosPaginadosResult } from "./queries";

const botonBase =
  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs shadow-elevation-1 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
const botonActivo = `${botonBase} bg-primary font-bold text-on-primary hover:opacity-90`;
const botonInactivo = `${botonBase} border border-outline-variant/60 bg-card font-semibold text-charcoal hover:bg-surface-container`;

type Pestana = "movimiento" | "transferencia";

export function SeccionMovimientos({
  cuentas,
  movimientosIniciales,
}: {
  cuentas: CuentaConSaldo[];
  movimientosIniciales: MovimientosPaginadosResult;
}) {
  const [pestana, setPestana] = useState<Pestana>("movimiento");
  const [gestionandoCategorias, setGestionandoCategorias] = useState(false);
  const puedeTransferir = cuentas.length >= 2;

  // El botón "Registrar Actividad" de la topbar pide volver al formulario.
  useEffect(() => {
    const volverAlFormulario = () => setPestana("movimiento");
    window.addEventListener("finanzas:nuevo-movimiento", volverAlFormulario);
    return () =>
      window.removeEventListener("finanzas:nuevo-movimiento", volverAlFormulario);
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold leading-tight text-heading">
          Historial de Movimientos
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPestana("movimiento")}
            aria-pressed={pestana === "movimiento"}
            className={
              pestana === "movimiento" ? botonActivo : botonInactivo
            }
          >
            <PlusCircle size={14} />
            <span>Nuevo Movimiento</span>
          </button>

          {puedeTransferir && (
            <button
              type="button"
              onClick={() => setPestana("transferencia")}
              aria-pressed={pestana === "transferencia"}
              className={
                pestana === "transferencia" ? botonActivo : botonInactivo
              }
            >
              <ArrowRightLeft size={14} />
              <span>Transferir entre cuentas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setGestionandoCategorias(true)}
            className={botonInactivo}
          >
            <Settings size={14} />
            <span>Gestionar categorías</span>
          </button>
        </div>
      </div>

      <OperacionesForm cuentas={cuentas} pestana={pestana} />

      <ListaMovimientos initialData={movimientosIniciales} cuentas={cuentas} />

      {gestionandoCategorias && (
        <GestionarCategoriasModal
          onClose={() => setGestionandoCategorias(false)}
        />
      )}
    </section>
  );
}
