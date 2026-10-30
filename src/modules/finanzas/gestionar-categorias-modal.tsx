"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { getCategoriasFinanzas } from "./queries";
import {
  crearCategoriaFinanza,
  actualizarCategoriaFinanza,
  eliminarCategoriaFinanza,
} from "./actions";
import { CategoriaIcon, ICONOS_CATEGORIAS_LISTA } from "./iconos-categorias";

const input =
  "w-full rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-pebble focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const botonPrimario =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50";
const botonSecundario =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-outline-variant/60 px-3.5 py-1.5 text-xs font-semibold text-charcoal transition hover:bg-surface-container";
const accionIcono =
  "rounded-md p-1 text-pebble transition hover:bg-surface-container hover:text-charcoal";
const chipActivo = "bg-inverse-surface font-bold text-inverse-on-surface";

export function GestionarCategoriasModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"gasto" | "ingreso">("gasto");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState<any>(null);
  const [agregando, setAgregando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "gasto",
    icono: "Tag",
    parentId: "",
    orden: 0,
  });

  const cargar = async () => {
    const rows = await getCategoriasFinanzas();
    setCategorias(rows);
  };

  useEffect(() => {
    cargar();
  }, []);

  const padres = categorias.filter((c) => c.tipo === tab && !c.parentId);
  const hijos = categorias.filter((c) => c.tipo === tab && c.parentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-card shadow-elevation-4">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/50 px-6 py-4">
          <h3 className="text-base font-semibold text-heading">
            Gestionar categorías
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={accionIcono}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="inline-flex rounded-full border border-outline-variant/60 bg-surface-container p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab("gasto")}
              aria-pressed={tab === "gasto"}
              className={`rounded-full px-3 py-1 transition ${
                tab === "gasto" ? chipActivo : "text-charcoal hover:text-heading"
              }`}
            >
              Gastos
            </button>
            <button
              type="button"
              onClick={() => setTab("ingreso")}
              aria-pressed={tab === "ingreso"}
              className={`rounded-full px-3 py-1 transition ${
                tab === "ingreso"
                  ? chipActivo
                  : "text-charcoal hover:text-heading"
              }`}
            >
              Ingresos
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-auto px-6 py-4">
          {padres.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline-variant/60 bg-surface-container-low/60 px-4 py-8 text-center text-xs text-charcoal">
              Todavía no hay categorías de {tab === "gasto" ? "gastos" : "ingresos"}.
              Agregá la primera con el botón de abajo.
            </div>
          ) : (
            padres.map((padre) => (
              <div
                key={padre.id}
                className="overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-lowest"
              >
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <CategoriaIcon icono={padre.icono} size={16} />
                    <span className="truncate text-sm font-semibold text-heading">
                      {padre.nombre}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(padre);
                        setForm({
                          nombre: padre.nombre,
                          tipo: padre.tipo,
                          icono: padre.icono,
                          parentId: padre.parentId ? String(padre.parentId) : "",
                          orden: padre.orden,
                        });
                      }}
                      aria-label={`Editar ${padre.nombre}`}
                      className={accionIcono}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAgregando(true);
                        setForm({
                          nombre: "",
                          tipo: tab,
                          icono: "Tag",
                          parentId: String(padre.id),
                          orden: 0,
                        });
                      }}
                      className={accionIcono}
                      title="Agregar subcategoría"
                      aria-label={`Agregar subcategoría a ${padre.nombre}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                {hijos
                  .filter((h) => h.parentId === padre.id)
                  .map((hijo) => (
                    <div
                      key={hijo.id}
                      className="flex items-center justify-between gap-2 border-t border-outline-variant/40 p-2 pl-8"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <CategoriaIcon icono={hijo.icono} size={14} />
                        <span className="truncate text-sm text-charcoal">
                          {hijo.nombre}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(hijo);
                            setForm({
                              nombre: hijo.nombre,
                              tipo: hijo.tipo,
                              icono: hijo.icono,
                              parentId: hijo.parentId
                                ? String(hijo.parentId)
                                : "",
                              orden: hijo.orden,
                            });
                          }}
                          aria-label={`Editar ${hijo.nombre}`}
                          className={accionIcono}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            startTransition(async () => {
                              await eliminarCategoriaFinanza(hijo.id);
                              await cargar();
                            })
                          }
                          aria-label={`Eliminar ${hijo.nombre}`}
                          className="rounded-md p-1 text-pebble transition hover:bg-error-container/60 hover:text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-outline-variant/50 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              setAgregando(true);
              setForm({
                nombre: "",
                tipo: tab,
                icono: "Tag",
                parentId: "",
                orden: 0,
              });
            }}
            className={botonPrimario}
          >
            <Plus size={14} />
            Agregar categoría
          </button>
          <button type="button" onClick={onClose} className={botonSecundario}>
            Cerrar
          </button>
        </div>

        {(agregando || editando) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-outline-variant/60 bg-card p-6 shadow-elevation-4">
              <h4 className="mb-4 text-sm font-semibold text-heading">
                {editando ? "Editar categoría" : "Agregar categoría"}
              </h4>
              <div className="space-y-3">
                <input
                  className={input}
                  placeholder="Nombre"
                  aria-label="Nombre de la categoría"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
                <select
                  className={input}
                  aria-label="Categoría padre"
                  value={form.parentId}
                  onChange={(e) =>
                    setForm({ ...form, parentId: e.target.value })
                  }
                >
                  <option value="">Sin categoría padre</option>
                  {padres.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <div>
                  <p className="mb-2 text-xs font-medium text-charcoal">Icono</p>
                  <div className="grid max-h-40 grid-cols-8 gap-1 overflow-auto rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-2">
                    {ICONOS_CATEGORIAS_LISTA.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setForm({ ...form, icono: i })}
                        aria-pressed={form.icono === i}
                        className={`flex size-8 items-center justify-center rounded-md transition ${
                          form.icono === i
                            ? "bg-inverse-surface text-inverse-on-surface"
                            : "text-charcoal hover:bg-surface-container"
                        }`}
                        title={i}
                      >
                        <CategoriaIcon icono={i} size={16} />
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  className={input}
                  placeholder="Orden"
                  aria-label="Orden"
                  value={form.orden}
                  onChange={(e) =>
                    setForm({ ...form, orden: Number(e.target.value) })
                  }
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAgregando(false);
                    setEditando(null);
                  }}
                  className={botonSecundario}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const fd = new FormData();
                      fd.append("nombre", form.nombre);
                      fd.append("tipo", form.tipo);
                      fd.append("icono", form.icono);
                      fd.append("orden", String(form.orden));
                      if (form.parentId) fd.append("parentId", form.parentId);
                      if (editando) {
                        fd.append("id", String(editando.id));
                        await actualizarCategoriaFinanza(fd);
                      } else {
                        await crearCategoriaFinanza(fd);
                      }
                      setAgregando(false);
                      setEditando(null);
                      await cargar();
                    })
                  }
                  className={botonPrimario}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
