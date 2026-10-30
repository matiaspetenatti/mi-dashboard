"use client";

import { useState, useTransition } from "react";
import { formatMonto, fechaHoy } from "@/lib/format";
import type { CuentaConSaldo } from "./queries";
import { tiposCuenta, type TipoCuenta } from "./schema";
import {
  ajustarSaldoCuenta,
  borrarCuenta,
  crearCuenta,
  actualizarCuenta,
  sincronizarRendimientosAction,
} from "./actions";
import {
  Plus,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Pencil,
  Trash2,
  Wallet,
  Landmark,
  Banknote,
  CircleDollarSign,
  X,
  Scale,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-pebble focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "block space-y-1";
const etiquetaClass = "text-xs font-medium text-charcoal";

const botonPrimario =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50";
const botonSecundario =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-outline-variant/60 px-4 py-2 text-sm font-medium text-charcoal transition hover:bg-surface-container";
const botonPeligro =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#cb272f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a81f26]";

const coloresPreset = [
  { nombre: "Azul MercadoPago", valor: "#009ee3" },
  { nombre: "Azul Banco", valor: "#2563eb" },
  { nombre: "Violeta Ualá", valor: "#7c3aed" },
  { nombre: "Verde Efectivo", valor: "#10b981" },
  { nombre: "Naranja", valor: "#f97316" },
  { nombre: "Rojo", valor: "#ef4444" },
  { nombre: "Gris", valor: "#64748b" },
];

function getTipoIcon(tipo: TipoCuenta) {
  switch (tipo) {
    case "billetera":
      return Wallet;
    case "banco":
      return Landmark;
    case "efectivo":
      return Banknote;
    case "inversion":
      return TrendingUp;
    default:
      return CircleDollarSign;
  }
}

function getTipoLabel(tipo: TipoCuenta) {
  switch (tipo) {
    case "billetera":
      return "Billetera virtual";
    case "banco":
      return "Banco";
    case "efectivo":
      return "Efectivo";
    case "inversion":
      return "Inversión";
    default:
      return "Otro";
  }
}

function Modal({
  titulo,
  ancho = "max-w-md",
  onClose,
  children,
}: {
  titulo: React.ReactNode;
  ancho?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className={`max-h-[90vh] w-full ${ancho} overflow-y-auto rounded-xl border border-outline-variant/60 bg-card p-6 shadow-elevation-4`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/50 pb-3">
          <h3 className="text-base font-semibold text-heading">{titulo}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-pebble transition hover:bg-surface-container hover:text-charcoal"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CuentasSection({ cuentas }: { cuentas: CuentaConSaldo[] }) {
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [cuentaAEditar, setCuentaAEditar] = useState<CuentaConSaldo | null>(null);
  const [cuentaABorrar, setCuentaABorrar] = useState<CuentaConSaldo | null>(null);
  const [cuentaAAjustar, setCuentaAAjustar] = useState<CuentaConSaldo | null>(null);

  const [nuevoSaldoAjuste, setNuevoSaldoAjuste] = useState("");
  const [fechaAjuste, setFechaAjuste] = useState(fechaHoy());
  const [descripcionAjuste, setDescripcionAjuste] = useState("");
  const [mensajeAjuste, setMensajeAjuste] = useState<string | null>(null);

  // Estados para el modal de creación
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<TipoCuenta>("billetera");
  const [nuevoColor, setNuevoColor] = useState("#009ee3");
  const [nuevoRendimiento, setNuevoRendimiento] = useState("19");
  const [nuevoSaldoInicial, setNuevoSaldoInicial] = useState("");
  const [calcularAyer, setCalcularAyer] = useState(true);

  // Estado para el modal de edición
  const [editRendimiento, setEditRendimiento] = useState(0);

  const [isPending, startTransition] = useTransition();
  const [mensajeSync, setMensajeSync] = useState<string | null>(null);

  const handleSincronizar = () => {
    startTransition(async () => {
      setMensajeSync(null);
      const res = await sincronizarRendimientosAction();
      if (res && res.totalGenerados > 0) {
        setMensajeSync(
          `✓ Se calcularon ${res.totalGenerados} rendimientos diarios (${formatMonto(res.totalMontoCentavos)})`,
        );
      } else {
        setMensajeSync("✓ Los rendimientos están al día con la fecha de ayer.");
      }
      setTimeout(() => setMensajeSync(null), 5000);
    });
  };

  // Cálculo en vivo para el modal de creación
  const saldoInicialNum =
    Number(nuevoSaldoInicial.replace(/\./g, "").replace(",", ".")) || 0;
  const tasaNum = Number(nuevoRendimiento) || 0;
  const estimadoDiarioSimulado =
    saldoInicialNum > 0 && tasaNum > 0
      ? Math.round(((saldoInicialNum * 100) * (tasaNum / 100)) / 365)
      : 0;

  return (
    <section className="space-y-4">
      {/* Cabecera de cuentas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold leading-tight text-heading">
            Mis Cuentas
          </h2>
          <p className="text-xs text-charcoal">
            Gestioná tus cuentas, saldos y rendimientos diarios de cada una
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSincronizar}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-charcoal shadow-elevation-1 transition hover:bg-surface-container active:scale-[0.98] disabled:opacity-50"
            title="Calcula los rendimientos diarios pendientes a las 00:00"
          >
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            <span>{isPending ? "Sincronizando..." : "Sincronizar rendimientos"}</span>
          </button>
          <button
            onClick={() => setModalCrearAbierto(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-on-primary transition hover:opacity-90 active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {mensajeSync && (
        <div className="rounded-lg border border-success/25 bg-success-container px-3 py-2 text-xs font-medium text-on-success-container">
          {mensajeSync}
        </div>
      )}

      {/* Grid de cuentas */}
      <div className="grid gap-4 md:grid-cols-2">
        {cuentas.map((c) => {
          const Icon = getTipoIcon(c.tipo);
          const tieneRendimiento = c.rendimientoAnual > 0;

          return (
            <div
              key={c.id}
              className="relative flex flex-col justify-between gap-3 rounded-xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1 transition hover:border-outline"
              style={{ borderLeftWidth: "4px", borderLeftColor: c.color }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${c.color} 16%, transparent)`,
                      color: c.color,
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold leading-tight text-heading">
                      {c.nombre}
                    </h3>
                    <span className="text-[11px] text-charcoal">
                      {getTipoLabel(c.tipo)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setCuentaAEditar(c);
                      setEditRendimiento(c.rendimientoAnual);
                    }}
                    className="rounded-md p-1 text-pebble transition hover:bg-surface-container hover:text-charcoal"
                    title="Editar cuenta"
                    aria-label={`Editar ${c.nombre}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setCuentaAAjustar(c);
                      setNuevoSaldoAjuste(
                        (c.saldo / 100).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                      );
                      setFechaAjuste(fechaHoy());
                      setDescripcionAjuste("Ajuste de saldo");
                      setMensajeAjuste(null);
                    }}
                    className="rounded-md p-1 text-pebble transition hover:bg-surface-container hover:text-charcoal"
                    title="Ajustar saldo"
                    aria-label={`Ajustar saldo de ${c.nombre}`}
                  >
                    <Scale size={14} />
                  </button>
                  {cuentas.length > 1 && (
                    <button
                      onClick={() => setCuentaABorrar(c)}
                      className="rounded-md p-1 text-pebble transition hover:bg-error-container/60 hover:text-error"
                      title="Eliminar cuenta"
                      aria-label={`Eliminar ${c.nombre}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Saldo */}
              <div>
                <span className="block text-[11px] font-medium text-charcoal">
                  Saldo actual
                </span>
                <span
                  className={`text-2xl font-extrabold tracking-tight ${
                    c.saldo < 0 ? "text-error" : "text-heading"
                  }`}
                >
                  {formatMonto(c.saldo)}
                </span>
              </div>

              {/* Rendimiento diario */}
              {tieneRendimiento ? (
                <div className="space-y-1 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-success">
                      <TrendingUp size={13} />
                      {c.rendimientoAnual}% TNA
                    </span>
                    <span className="font-bold text-success">
                      +{formatMonto(c.estimadoDiario)} / día
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-charcoal">
                    <span>Estimado mensual</span>
                    <span className="font-medium text-success">
                      +{formatMonto(c.estimadoMensual)}
                    </span>
                  </div>
                  {c.ultimoRendimientoFecha && (
                    <p className="pt-1 text-[10px] text-pebble">
                      Calculado hasta: {c.ultimoRendimientoFecha}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-outline-variant/50 bg-surface-container-low p-3 text-center text-[11px] text-charcoal">
                  <span>Sin rendimiento diario configurado</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Nueva Cuenta */}
      {modalCrearAbierto && (
        <Modal
          titulo="Nueva Cuenta"
          onClose={() => setModalCrearAbierto(false)}
        >
          <form
            action={async (formData) => {
              await crearCuenta(formData);
              setModalCrearAbierto(false);
              setNuevoNombre("");
              setNuevoSaldoInicial("");
            }}
            className="mt-4 space-y-4"
          >
            <label className={labelClass}>
              <span className={etiquetaClass}>Nombre de la cuenta</span>
              <input
                name="nombre"
                placeholder="ej. Mercado Pago, Banco Galicia, Efectivo"
                required
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className={etiquetaClass}>Tipo de cuenta</span>
                <select
                  name="tipo"
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as TipoCuenta)}
                  className={inputClass}
                >
                  {tiposCuenta.map((t) => (
                    <option key={t} value={t}>
                      {getTipoLabel(t)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                <span className={etiquetaClass}>Color identificador</span>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {coloresPreset.map((cp) => (
                    <button
                      key={cp.valor}
                      type="button"
                      onClick={() => setNuevoColor(cp.valor)}
                      aria-label={cp.nombre}
                      className={`size-6 rounded-full border-2 transition ${
                        nuevoColor === cp.valor
                          ? "scale-110 border-heading"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: cp.valor }}
                      title={cp.nombre}
                    />
                  ))}
                  <input type="hidden" name="color" value={nuevoColor} />
                </div>
              </label>
            </div>

            <label className={labelClass}>
              <span className={etiquetaClass}>
                Saldo actual / inicial (opcional)
              </span>
              <input
                name="saldoInicial"
                inputMode="decimal"
                placeholder="ej. 29412,04"
                value={nuevoSaldoInicial}
                onChange={(e) => setNuevoSaldoInicial(e.target.value)}
                className={inputClass}
              />
            </label>

            {/* Rendimiento anual */}
            <div className="space-y-2 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
              <label className={labelClass}>
                <div className="flex items-center justify-between gap-2">
                  <span className={etiquetaClass}>Rendimiento anual (% TNA)</span>
                  <span className="text-[11px] font-normal text-pebble">
                    0 = no remunerada
                  </span>
                </div>
                <input
                  name="rendimientoAnual"
                  type="number"
                  step="0.01"
                  min="0"
                  max="500"
                  placeholder="ej. 19 para 19% anual"
                  value={nuevoRendimiento}
                  onChange={(e) => setNuevoRendimiento(e.target.value)}
                  className={inputClass}
                />
              </label>

              {tasaNum > 0 && (
                <div className="space-y-1 pt-1 text-xs text-charcoal">
                  <p className="flex items-center gap-1 font-medium text-success">
                    <Sparkles size={13} />
                    Se calculará automáticamente cada medianoche (00:00).
                  </p>
                  {saldoInicialNum > 0 && (
                    <div className="rounded-lg border border-success/20 bg-success-container/60 p-2 text-on-success-container">
                      <p className="font-semibold">
                        Con ${saldoInicialNum.toLocaleString("es-AR")} al{" "}
                        {tasaNum}%:
                      </p>
                      <p>
                        • Diario: ~+{formatMonto(estimadoDiarioSimulado)} al día
                      </p>
                      <p>
                        • Mensual: ~+{formatMonto(estimadoDiarioSimulado * 30)}{" "}
                        al mes
                      </p>
                    </div>
                  )}

                  <label className="flex cursor-pointer select-none items-center gap-2 pt-1 text-xs">
                    <input
                      type="checkbox"
                      name="calcularAyer"
                      checked={calcularAyer}
                      onChange={(e) => setCalcularAyer(e.target.checked)}
                      className="size-4 rounded border-outline-variant accent-primary"
                    />
                    <span>
                      Acreditar rendimiento del día de ayer inmediatamente
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalCrearAbierto(false)}
                className={botonSecundario}
              >
                Cancelar
              </button>
              <button type="submit" className={botonPrimario}>
                Crear Cuenta
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Editar Cuenta */}
      {cuentaAEditar && (
        <Modal
          titulo={`Editar Cuenta: ${cuentaAEditar.nombre}`}
          onClose={() => setCuentaAEditar(null)}
        >
          <form
            action={async (formData) => {
              await actualizarCuenta(formData);
              setCuentaAEditar(null);
            }}
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="id" value={cuentaAEditar.id} />

            <label className={labelClass}>
              <span className={etiquetaClass}>Nombre</span>
              <input
                name="nombre"
                defaultValue={cuentaAEditar.nombre}
                required
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className={etiquetaClass}>Tipo</span>
                <select
                  name="tipo"
                  defaultValue={cuentaAEditar.tipo}
                  className={inputClass}
                >
                  {tiposCuenta.map((t) => (
                    <option key={t} value={t}>
                      {getTipoLabel(t)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                <span className={etiquetaClass}>Color</span>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {coloresPreset.map((cp) => (
                    <label key={cp.valor} className="cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={cp.valor}
                        defaultChecked={cuentaAEditar.color === cp.valor}
                        className="peer sr-only"
                      />
                      <span
                        className="block size-6 rounded-full border-2 border-transparent transition hover:scale-110 peer-checked:border-heading"
                        style={{ backgroundColor: cp.valor }}
                        title={cp.nombre}
                      />
                    </label>
                  ))}
                </div>
              </label>
            </div>

            {/* Rendimiento anual */}
            <div className="space-y-2 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
              <label className={labelClass}>
                <div className="flex items-center justify-between gap-2">
                  <span className={etiquetaClass}>Rendimiento anual (% TNA)</span>
                  <span className="text-[11px] font-normal text-pebble">
                    0 = desactivar
                  </span>
                </div>
                <input
                  name="rendimientoAnual"
                  type="number"
                  step="0.01"
                  min="0"
                  max="500"
                  defaultValue={cuentaAEditar.rendimientoAnual}
                  onChange={(e) => setEditRendimiento(Number(e.target.value) || 0)}
                  className={inputClass}
                />
              </label>

              {editRendimiento > 0 && cuentaAEditar.saldo > 0 && (
                <div className="rounded-lg border border-success/20 bg-success-container/60 p-2 text-xs text-on-success-container">
                  <p className="font-semibold">
                    Con tu saldo de {formatMonto(cuentaAEditar.saldo)} al{" "}
                    {editRendimiento}%:
                  </p>
                  <p>
                    • Generará: ~+
                    {formatMonto(
                      Math.round(
                        (cuentaAEditar.saldo * (editRendimiento / 100)) / 365,
                      ),
                    )}{" "}
                    cada medianoche
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCuentaAEditar(null)}
                className={botonSecundario}
              >
                Cancelar
              </button>
              <button type="submit" className={botonPrimario}>
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Ajustar saldo */}
      {cuentaAAjustar && (
        <Modal
          titulo={`Ajustar saldo: ${cuentaAAjustar.nombre}`}
          onClose={() => {
            setCuentaAAjustar(null);
            setMensajeAjuste(null);
          }}
        >
          <form
            action={async (formData) => {
              setMensajeAjuste(null);
              const res = await ajustarSaldoCuenta(formData);
              if (res?.error) {
                setMensajeAjuste(res.error);
                return;
              }
              if (res?.sinCambios) {
                setMensajeAjuste("El saldo ya es igual al nuevo valor.");
                return;
              }
              setCuentaAAjustar(null);
              setNuevoSaldoAjuste("");
              setDescripcionAjuste("");
              setMensajeAjuste(null);
            }}
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="cuentaId" value={cuentaAAjustar.id} />

            <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-2.5">
              <p className="text-[11px] text-charcoal">Saldo actual</p>
              <p className="text-sm font-semibold text-heading">
                {formatMonto(cuentaAAjustar.saldo)}
              </p>
            </div>

            <label className={labelClass}>
              <span className={etiquetaClass}>Nuevo saldo ($)</span>
              <input
                name="nuevoSaldo"
                inputMode="decimal"
                required
                value={nuevoSaldoAjuste}
                onChange={(e) => setNuevoSaldoAjuste(e.target.value)}
                placeholder="ej. 50000,00"
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className={etiquetaClass}>Fecha</span>
                <input
                  type="date"
                  name="fecha"
                  value={fechaAjuste}
                  onChange={(e) => setFechaAjuste(e.target.value)}
                  required
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={etiquetaClass}>Motivo (opcional)</span>
                <input
                  name="descripcion"
                  value={descripcionAjuste}
                  onChange={(e) => setDescripcionAjuste(e.target.value)}
                  placeholder="Ajuste de saldo"
                  className={inputClass}
                />
              </label>
            </div>

            {mensajeAjuste && (
              <div className="rounded-lg border border-error/25 bg-error-container/60 px-3 py-2 text-xs text-on-error-container">
                {mensajeAjuste}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCuentaAAjustar(null);
                  setMensajeAjuste(null);
                }}
                className={botonSecundario}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={botonPrimario}
              >
                Guardar ajuste
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Borrar cuenta */}
      {cuentaABorrar && (
        <Modal
          titulo={`¿Eliminar cuenta "${cuentaABorrar.nombre}"?`}
          ancho="max-w-sm"
          onClose={() => setCuentaABorrar(null)}
        >
          <p className="mt-2 text-xs text-charcoal">
            Esta acción eliminará la cuenta y todos los movimientos asociados a
            ella.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCuentaABorrar(null)}
              className={botonSecundario}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await borrarCuenta(cuentaABorrar.id);
                setCuentaABorrar(null);
              }}
              className={botonPeligro}
            >
              Eliminar Cuenta
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
