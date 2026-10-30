"use client";

import { useEffect, useMemo, useState } from "react";
import { categorias } from "./categorias";
import { crearMovimiento, transferirEntreCuentas } from "./actions";
import type { CuentaConSaldo } from "./queries";
import { formatMonto } from "@/lib/format";
import { getCategoriasFinanzas } from "./queries";
import { useToast } from "@/hooks/use-toast";

const campo =
  "w-full rounded-xl border border-outline-variant/70 bg-surface-container-low px-3 py-2 text-xs font-medium text-heading placeholder:text-pebble focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const campoSelect = `${campo} pr-8`;
const botonEnviar =
  "shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50";

type Pestana = "movimiento" | "transferencia";

export function OperacionesForm({
  cuentas,
  pestana,
}: {
  cuentas: CuentaConSaldo[];
  pestana: Pestana;
}) {
  const toast = useToast();
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<number>(
    cuentas[0]?.id ?? 0,
  );
  const [cuentaDestino, setCuentaDestino] = useState<number>(
    cuentas.find((c) => c.id !== cuentas[0]?.id)?.id ?? 0,
  );
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [categoriasDb, setCategoriasDb] = useState<any[]>([]);

  useEffect(() => {
    getCategoriasFinanzas().then((rows) => {
      setCategoriasDb(rows);
      if (rows.length > 0) {
        const first = rows.find((r: any) => r.tipo === tipo && !r.parentId);
        if (first && !categoria) setCategoria(first.nombre);
      }
    });
    // La categoría inicial se resuelve una sola vez por tipo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  // Si la categoría guardada no corresponde al tipo actual (por ejemplo al
  // volver de "Transferencia"), mostramos la primera disponible de ese tipo.
  const categoriaSeleccionada = useMemo(() => {
    if (!categoriasDb.length) return categoria;
    const existe = categoriasDb.some(
      (c: any) => c.nombre === categoria && c.tipo === tipo,
    );
    if (existe) return categoria;
    const primera = categoriasDb.find(
      (c: any) => c.tipo === tipo && !c.parentId,
    );
    return primera?.nombre ?? categoria;
  }, [categoriasDb, categoria, tipo]);

  const categoriasPorTipo =
    categoriasDb.length > 0
      ? categoriasDb.filter((c: any) => c.tipo === tipo)
      : categorias
          .filter((c) => {
            if (tipo === "ingreso")
              return [
                "Sueldo",
                "Rendimientos",
                "Transferencia",
                "Ajuste",
                "Otros",
              ].includes(c);
            return [
              "Comida",
              "Transporte",
              "Servicios",
              "Ocio",
              "Salud",
              "Estudio",
              "Transferencia",
              "Ajuste",
              "Otros",
            ].includes(c);
          })
          .map((c) => ({ nombre: c, icono: "Tag", parentId: null }));

  return (
    <div className="rounded-xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
      {pestana === "movimiento" ? (
        <form
          id="nuevo-movimiento"
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
            } catch {
              toast.error("Error al agregar movimiento");
            }
          }}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6"
        >
          {/* Cuenta */}
          <select
            name="cuentaId"
            aria-label="Cuenta"
            value={cuentaSeleccionada}
            onChange={(e) => setCuentaSeleccionada(Number(e.target.value))}
            className={campoSelect}
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
            aria-label="Tipo de movimiento"
            value={tipo}
            onChange={(e) => {
              const val = e.target.value as "gasto" | "ingreso";
              setTipo(val);
              if (val === "ingreso" && categoriaSeleccionada === "Comida") {
                setCategoria("Sueldo");
              } else if (val === "gasto" && categoriaSeleccionada === "Sueldo") {
                setCategoria("Comida");
              }
            }}
            className={campoSelect}
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>

          {/* Monto */}
          <input
            id="campo-monto"
            name="monto"
            inputMode="decimal"
            placeholder="Monto (ej: 1500,50)"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={campo}
          />

          {/* Categoría */}
          <select
            name="categoria"
            aria-label="Categoría"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoria(e.target.value)}
            className={campoSelect}
          >
            {categoriasDb.length > 0 ? (
              categoriasPorTipo
                .filter((c: any) => !c.parentId)
                .flatMap((padre: any) => {
                  const hijos = categoriasPorTipo.filter(
                    (h: any) => h.parentId === padre.id,
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
                      )),
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
            className={campo}
          />

          {/* Fecha + enviar */}
          <div className="col-span-2 flex gap-2 sm:col-span-1">
            <input
              type="date"
              name="fecha"
              aria-label="Fecha"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={campo}
            />
            <button type="submit" className={botonEnviar}>
              Agregar
            </button>
          </div>
        </form>
      ) : (
        <form
          id="nuevo-movimiento"
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
            } catch {
              toast.error("Error al realizar transferencia");
            }
          }}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6"
        >
          {/* Origen */}
          <label className={`${campo} flex items-center gap-1.5`}>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-pebble">
              De
            </span>
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
              className="w-full min-w-0 bg-transparent text-xs font-medium text-heading focus:outline-none"
              required
            >
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({formatMonto(c.saldo)})
                </option>
              ))}
            </select>
          </label>

          {/* Destino */}
          <label className={`${campo} flex items-center gap-1.5`}>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-pebble">
              A
            </span>
            <select
              name="cuentaDestinoId"
              value={cuentaDestino}
              onChange={(e) => setCuentaDestino(Number(e.target.value))}
              className="w-full min-w-0 bg-transparent text-xs font-medium text-heading focus:outline-none"
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
          </label>

          {/* Monto */}
          <input
            name="monto"
            inputMode="decimal"
            placeholder="Monto a transferir"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={campo}
          />

          {/* Motivo */}
          <input
            name="descripcion"
            placeholder="Motivo (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={campo}
          />

          {/* Fecha + enviar */}
          <div className="col-span-2 flex gap-2 sm:col-span-1 lg:col-span-2">
            <input
              type="date"
              name="fecha"
              aria-label="Fecha"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={campo}
            />
            <button type="submit" className={botonEnviar}>
              Transferir
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
