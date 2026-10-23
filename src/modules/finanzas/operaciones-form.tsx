"use client";

import { useEffect, useState } from "react";
import { categorias } from "./categorias";
import { crearMovimiento, transferirEntreCuentas } from "./actions";
import type { CuentaConSaldo } from "./queries";
import { formatMonto } from "@/lib/format";
import { ArrowRightLeft, PlusCircle, Settings } from "lucide-react";
import { getCategoriasFinanzas } from "./queries";
import { GestionarCategoriasModal } from "./gestionar-categorias-modal";
import { useToast } from "@/hooks/use-toast";

const input = "rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900";

export function OperacionesForm({ cuentas }: { cuentas: CuentaConSaldo[] }) {
  const toast = useToast();
  const [pestana, setPestana] = useState<"movimiento" | "transferencia">("movimiento");
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<number>(cuentas[0]?.id ?? 0);
  const [cuentaDestino, setCuentaDestino] = useState<number>(
    cuentas.find((c) => c.id !== cuentas[0]?.id)?.id ?? 0
  );
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [mostrarGestionCategorias, setMostrarGestionCategorias] = useState(false);
  const [categoriasDb, setCategoriasDb] = useState<any[]>([]);

  useEffect(() => {
    getCategoriasFinanzas().then((rows) => {
      setCategoriasDb(rows);
      if (rows.length > 0) {
        const first = rows.find((r: any) => r.tipo === tipo && !r.parentId);
        if (first && !categoria) setCategoria(first.nombre);
      }
    });
  }, [tipo]);

  const categoriasPorTipo = categoriasDb.length > 0
    ? categoriasDb.filter((c: any) => c.tipo === tipo)
    : categorias.filter((c) => {
        if (tipo === "ingreso") return ["Sueldo", "Rendimientos", "Transferencia", "Ajuste", "Otros"].includes(c);
        return ["Comida", "Transporte", "Servicios", "Ocio", "Salud", "Estudio", "Transferencia", "Ajuste", "Otros"].includes(c);
      }).map((c) => ({ nombre: c, icono: "Tag", parentId: null }));

  return (
    <div className="rounded-xl border bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b mb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPestana("movimiento")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                pestana === "movimiento"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <PlusCircle size={14} />
              <span>Nuevo Movimiento</span>
            </button>
            {cuentas.length >= 2 && (
              <button
                type="button"
                onClick={() => setPestana("transferencia")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  pestana === "transferencia"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <ArrowRightLeft size={14} />
                <span>Transferir entre cuentas</span>
              </button>
            )}
          </div>
          {pestana === "movimiento" && (
            <button
              type="button"
              onClick={() => setMostrarGestionCategorias(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
            >
              <Settings size={14} />
              <span>Gestionar categorías</span>
            </button>
          )}
        </div>

      {pestana === "movimiento" ? (
        <form
          action={async (formData) => {
            try {
              const res = await crearMovimiento(formData);
              if (res?.error) {
                toast.error(res.error);
                return;
              }
              toast.success("Movimiento agregado correctamente");
              setMonto("");
              setDescripcion("");
            } catch (e) {
              toast.error("Error al agregar movimiento");
            }
          }}
          className="flex flex-wrap items-center gap-2"
        >
          {/* Selector de cuenta */}
          <select
            name="cuentaId"
            value={cuentaSeleccionada}
            onChange={(e) => setCuentaSeleccionada(Number(e.target.value))}
            className={`${input} font-medium`}
            required
          >
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({formatMonto(c.saldo)})
              </option>
            ))}
          </select>

          {/* Tipo */}
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => {
              const val = e.target.value as "gasto" | "ingreso";
              setTipo(val);
              if (val === "ingreso" && categoria === "Comida") {
                setCategoria("Sueldo");
              } else if (val === "gasto" && categoria === "Sueldo") {
                setCategoria("Comida");
              }
            }}
            className={input}
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>

          {/* Monto */}
          <input
            name="monto"
            inputMode="decimal"
            placeholder="Monto (ej: 1500,50)"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={`${input} w-40`}
          />

          {/* Categoría */}
          <select
            name="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={input}
          >
            {categoriasDb.length > 0 ? (
              categoriasPorTipo
                .filter((c: any) => !c.parentId)
                .flatMap((padre: any) => {
                  const hijos = categoriasPorTipo.filter((h: any) => h.parentId === padre.id);
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
              categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))
            )}
          </select>

          {/* Descripción */}
          <input
            name="descripcion"
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={`${input} flex-1 min-w-36`}
          />

          {/* Fecha */}
          <input
            type="date"
            name="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={input}
          />

          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            Agregar
          </button>
        </form>
      ) : (
        <form
          action={async (formData) => {
            try {
              const res = await transferirEntreCuentas(formData);
              if (res?.error) {
                toast.error(res.error);
                return;
              }
              toast.success("Transferencia realizada correctamente");
              setMonto("");
              setDescripcion("");
            } catch (e) {
              toast.error("Error al realizar transferencia");
            }
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500 font-medium">De:</span>
            <select
              name="cuentaOrigenId"
              value={cuentaSeleccionada}
              onChange={(e) => {
                const nuevo = Number(e.target.value);
                setCuentaSeleccionada(nuevo);
                if (nuevo === cuentaDestino) {
                  const otra = cuentas.find((c) => c.id !== nuevo);
                  if (otra) setCuentaDestino(otra.id);
                }
              }}
              className={input}
              required
            >
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({formatMonto(c.saldo)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500 font-medium">A:</span>
            <select
              name="cuentaDestinoId"
              value={cuentaDestino}
              onChange={(e) => setCuentaDestino(Number(e.target.value))}
              className={input}
              required
            >
              {cuentas
                .filter((c) => c.id !== cuentaSeleccionada)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({formatMonto(c.saldo)})
                  </option>
                ))}
            </select>
          </div>

          <input
            name="monto"
            inputMode="decimal"
            placeholder="Monto a transferir"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={`${input} w-36`}
          />

          <input
            name="descripcion"
            placeholder="Motivo (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={`${input} flex-1 min-w-32`}
          />

          <input type="date" name="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} className={input} />

          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            Transferir
          </button>
        </form>
      )}
      {mostrarGestionCategorias && (
        <GestionarCategoriasModal onClose={() => setMostrarGestionCategorias(false)} />
      )}
    </div>
  );
}
