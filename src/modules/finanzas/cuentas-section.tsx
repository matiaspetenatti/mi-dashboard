"use client";

import { useState, useTransition } from "react";
import { formatMonto, fechaHoy } from "@/lib/format";
import type { CuentaConSaldo } from "./queries";
import { tiposCuenta, type TipoCuenta } from "./schema";
import { ajustarSaldoCuenta, borrarCuenta, crearCuenta, actualizarCuenta, sincronizarRendimientosAction } from "./actions";
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

const inputClass = "w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900";
const labelClass = "block space-y-1";
const etiquetaClass = "text-xs font-medium text-neutral-600";

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

export function CuentasSection({ cuentas }: { cuentas: CuentaConSaldo[] }) {
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [cuentaAEditar, setCuentaAEditar] = useState<CuentaConSaldo | null>(null);
  const [cuentaABorrar, setCuentaABorrar] = useState<CuentaConSaldo | null>(null);
  const [cuentaAAjustar, setCuentaAAjustar] = useState<CuentaConSaldo | null>(null);

  const [nuevoSaldoAjuste, setNuevoSaldoAjuste] = useState("");
  const [fechaAjuste, setFechaAjuste] = useState(fechaHoy());
  const [descripcionAjuste, setDescripcionAjuste] = useState("");
  const [mensajeAjuste, setMensajeAjuste] = useState<string | null>(null);

  // Estados interactivos para simulación en modal crear
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<TipoCuenta>("billetera");
  const [nuevoColor, setNuevoColor] = useState("#009ee3");
  const [nuevoRendimiento, setNuevoRendimiento] = useState("19");
  const [nuevoSaldoInicial, setNuevoSaldoInicial] = useState("");
  const [calcularAyer, setCalcularAyer] = useState(true);

  // Estados interactivos para simulación en modal editar
  const [editRendimiento, setEditRendimiento] = useState(0);

  const [isPending, startTransition] = useTransition();
  const [mensajeSync, setMensajeSync] = useState<string | null>(null);

  const handleSincronizar = () => {
    startTransition(async () => {
      setMensajeSync(null);
      const res = await sincronizarRendimientosAction();
      if (res && res.totalGenerados > 0) {
        setMensajeSync(
          `✓ Se calcularon ${res.totalGenerados} rendimientos diarios (${formatMonto(res.totalMontoCentavos)})`
        );
      } else {
        setMensajeSync("✓ Los rendimientos están al día con la fecha de ayer.");
      }
      setTimeout(() => setMensajeSync(null), 5000);
    });
  };

  // Cálculo en vivo para modal crear
  const saldoInicialNum = Number(nuevoSaldoInicial.replace(/\./g, "").replace(",", ".")) || 0;
  const tasaNum = Number(nuevoRendimiento) || 0;
  const estimadoDiarioSimulado =
    saldoInicialNum > 0 && tasaNum > 0
      ? Math.round(((saldoInicialNum * 100) * (tasaNum / 100)) / 365)
      : 0;

  return (
    <div className="space-y-4">
      {/* Barra de cabecera de cuentas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Mis Cuentas</h2>
          <p className="text-xs text-neutral-500">
            Gestioná tus cuentas, saldos y rendimientos diarios de cada una
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSincronizar}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50"
            title="Calcula los rendimientos diarios pendientes a las 00:00"
          >
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            <span>{isPending ? "Sincronizando..." : "Sincronizar rendimientos"}</span>
          </button>
          <button
            onClick={() => setModalCrearAbierto(true)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800"
          >
            <Plus size={14} />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {mensajeSync && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 animate-in fade-in">
          {mensajeSync}
        </div>
      )}

      {/* Grid de tarjetas de cuentas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cuentas.map((c) => {
          const Icon = getTipoIcon(c.tipo);
          const tieneRendimiento = c.rendimientoAnual > 0;

          return (
            <div
              key={c.id}
              className="relative flex flex-col justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:border-neutral-300"
              style={{ borderLeftWidth: "4px", borderLeftColor: c.color }}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 leading-tight">
                        {c.nombre}
                      </h3>
                      <span className="text-[11px] text-neutral-500">
                        {getTipoLabel(c.tipo)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCuentaAEditar(c);
                        setEditRendimiento(c.rendimientoAnual);
                      }}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      title="Editar cuenta"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setCuentaAAjustar(c);
                        setNuevoSaldoAjuste((c.saldo / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        setFechaAjuste(fechaHoy());
                        setDescripcionAjuste("Ajuste de saldo");
                        setMensajeAjuste(null);
                      }}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      title="Ajustar saldo"
                    >
                      <Scale size={13} />
                    </button>
                    {cuentas.length > 1 && (
                      <button
                        onClick={() => setCuentaABorrar(c)}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
                        title="Eliminar cuenta"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Saldo actual */}
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-neutral-500">Saldo actual</p>
                  <p
                    className={`text-xl font-bold ${
                      c.saldo < 0 ? "text-red-600" : "text-neutral-900"
                    }`}
                  >
                    {formatMonto(c.saldo)}
                  </p>
                </div>

                {/* Sección de rendimiento diario */}
                {tieneRendimiento ? (
                  <div className="mt-3 rounded-lg bg-emerald-50/70 border border-emerald-100 p-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-semibold text-emerald-800">
                        <TrendingUp size={13} />
                        {c.rendimientoAnual}% TNA
                      </span>
                      <span className="font-medium text-emerald-700">
                        +{formatMonto(c.estimadoDiario)} / día
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-600">
                      <span>Estimado mensual</span>
                      <span>+{formatMonto(c.estimadoMensual)}</span>
                    </div>
                    {c.ultimoRendimientoFecha && (
                      <p className="mt-1 text-[10px] text-emerald-600/80">
                        Calculado hasta: {c.ultimoRendimientoFecha}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg bg-neutral-50 border border-neutral-100 p-2 text-center text-[11px] text-neutral-500">
                    Sin rendimiento diario configurado
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Nueva Cuenta */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-semibold text-neutral-900">Nueva Cuenta</h3>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X size={18} />
              </button>
            </div>

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
                  <div className="flex items-center gap-1.5 pt-1">
                    {coloresPreset.map((cp) => (
                      <button
                        key={cp.valor}
                        type="button"
                        onClick={() => setNuevoColor(cp.valor)}
                        className={`h-6 w-6 rounded-full border-2 transition ${
                          nuevoColor === cp.valor
                            ? "border-neutral-900 scale-110"
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

              {/* Saldo inicial opcional */}
              <label className={labelClass}>
                <span className={etiquetaClass}>Saldo actual / inicial (opcional)</span>
                <input
                  name="saldoInicial"
                  inputMode="decimal"
                  placeholder="ej. 29412,04"
                  value={nuevoSaldoInicial}
                  onChange={(e) => setNuevoSaldoInicial(e.target.value)}
                  className={inputClass}
                />
              </label>

              {/* Rendimiento Anual */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 space-y-2">
                <label className={labelClass}>
                  <div className="flex items-center justify-between">
                    <span className={etiquetaClass}>Rendimiento anual (% TNA)</span>
                    <span className="text-[11px] text-neutral-500 font-normal">
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
                  <div className="text-xs text-neutral-600 space-y-1 pt-1">
                    <p className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Sparkles size={13} />
                      Se calculará automáticamente cada medianoche (00:00).
                    </p>
                    {saldoInicialNum > 0 && (
                      <div className="rounded-lg bg-emerald-100/60 p-2 text-emerald-900">
                        <p className="font-semibold">
                          Con ${saldoInicialNum.toLocaleString("es-AR")} al {tasaNum}%:
                        </p>
                        <p>
                          • Diario: ~+{formatMonto(estimadoDiarioSimulado)} al día
                        </p>
                        <p>
                          • Mensual: ~+{formatMonto(estimadoDiarioSimulado * 30)} al mes
                        </p>
                      </div>
                    )}

                    <label className="flex items-center gap-2 pt-1 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="calcularAyer"
                        checked={calcularAyer}
                        onChange={(e) => setCalcularAyer(e.target.checked)}
                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span>Acreditar rendimiento del día de ayer inmediatamente</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="rounded-lg border px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Cuenta */}
      {cuentaAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-semibold text-neutral-900">
                Editar Cuenta: {cuentaAEditar.nombre}
              </h3>
              <button
                onClick={() => setCuentaAEditar(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X size={18} />
              </button>
            </div>

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
                  <div className="flex items-center gap-1.5 pt-1">
                    {coloresPreset.map((cp) => (
                      <label key={cp.valor} className="cursor-pointer">
                        <input
                          type="radio"
                          name="color"
                          value={cp.valor}
                          defaultChecked={cuentaAEditar.color === cp.valor}
                          className="sr-only"
                        />
                        <span
                          className="block h-6 w-6 rounded-full border-2 border-transparent transition hover:scale-110 has-checked:border-neutral-900"
                          style={{ backgroundColor: cp.valor }}
                          title={cp.nombre}
                        />
                      </label>
                    ))}
                  </div>
                </label>
              </div>

              {/* Rendimiento Anual */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 space-y-2">
                <label className={labelClass}>
                  <div className="flex items-center justify-between">
                    <span className={etiquetaClass}>Rendimiento anual (% TNA)</span>
                    <span className="text-[11px] text-neutral-500 font-normal">
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
                  <div className="rounded-lg bg-emerald-100/60 p-2 text-xs text-emerald-900">
                    <p className="font-semibold">
                      Con tu saldo de {formatMonto(cuentaAEditar.saldo)} al {editRendimiento}%:
                    </p>
                    <p>
                      • Generará: ~+
                      {formatMonto(
                        Math.round(((cuentaAEditar.saldo) * (editRendimiento / 100)) / 365)
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
                  className="rounded-lg border px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajustar saldo */}
      {cuentaAAjustar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-semibold text-neutral-900">
                Ajustar saldo: {cuentaAAjustar.nombre}
              </h3>
              <button
                onClick={() => {
                  setCuentaAAjustar(null);
                  setMensajeAjuste(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X size={18} />
              </button>
            </div>

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

              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-2.5">
                <p className="text-[11px] text-neutral-500">Saldo actual</p>
                <p className="text-sm font-semibold text-neutral-900">{formatMonto(cuentaAAjustar.saldo)}</p>
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
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
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
                  className="rounded-lg border px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  Guardar ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {cuentaABorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border">
            <h3 className="text-base font-semibold text-neutral-900">
              ¿Eliminar cuenta &quot;{cuentaABorrar.nombre}&quot;?
            </h3>
            <p className="mt-2 text-xs text-neutral-500">
              Esta acción eliminará la cuenta y todos los movimientos asociados a ella.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCuentaABorrar(null)}
                className="rounded-lg border px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await borrarCuenta(cuentaABorrar.id);
                  setCuentaABorrar(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
