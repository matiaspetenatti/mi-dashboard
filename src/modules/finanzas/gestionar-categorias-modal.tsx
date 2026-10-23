"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { getCategoriasFinanzas } from "./queries";
import { crearCategoriaFinanza, actualizarCategoriaFinanza, eliminarCategoriaFinanza } from "./actions";
import { CategoriaIcon, ICONOS_CATEGORIAS_LISTA } from "./iconos-categorias";

const input = "w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900";

export function GestionarCategoriasModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"gasto" | "ingreso">("gasto");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState<any>(null);
  const [agregando, setAgregando] = useState(false);
  const [form, setForm] = useState({ nombre: "", tipo: "gasto", icono: "Tag", parentId: "", orden: 0 });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-neutral-900">Gestionar categorías</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-2">
            <button onClick={() => setTab("gasto")} className={`px-3 py-1.5 text-xs rounded-lg ${tab === "gasto" ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}>
              Gastos
            </button>
            <button onClick={() => setTab("ingreso")} className={`px-3 py-1.5 text-xs rounded-lg ${tab === "ingreso" ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}>
              Ingresos
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-2">
          {padres.map((padre) => (
            <div key={padre.id} className="rounded-lg border">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <CategoriaIcon icono={padre.icono} size={16} />
                  <span className="text-sm font-medium">{padre.nombre}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditando(padre);
                      setForm({ nombre: padre.nombre, tipo: padre.tipo, icono: padre.icono, parentId: padre.parentId ? String(padre.parentId) : "", orden: padre.orden });
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setAgregando(true);
                      setForm({ nombre: "", tipo: tab, icono: "Tag", parentId: String(padre.id), orden: 0 });
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                    title="Agregar subcategoría"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              {hijos
                .filter((h) => h.parentId === padre.id)
                .map((hijo) => (
                  <div key={hijo.id} className="flex items-center justify-between p-2 pl-8 border-t">
                    <div className="flex items-center gap-2">
                      <CategoriaIcon icono={hijo.icono} size={14} />
                      <span className="text-sm text-neutral-700">{hijo.nombre}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditando(hijo);
                          setForm({ nombre: hijo.nombre, tipo: hijo.tipo, icono: hijo.icono, parentId: hijo.parentId ? String(hijo.parentId) : "", orden: hijo.orden });
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => startTransition(async () => {
                          await eliminarCategoriaFinanza(hijo.id);
                          await cargar();
                        })}
                        className="p-1 text-neutral-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t flex justify-between">
          <button
            onClick={() => {
              setAgregando(true);
              setForm({ nombre: "", tipo: tab, icono: "Tag", parentId: "", orden: 0 });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-neutral-900 text-white"
          >
            <Plus size={14} />
            Agregar categoría
          </button>
          <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg border">
            Cerrar
          </button>
        </div>

        {(agregando || editando) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h4 className="text-sm font-semibold mb-4">{editando ? "Editar categoría" : "Agregar categoría"}</h4>
              <div className="space-y-3">
                <input className={input} placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                <select className={input} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">Sin categoría padre</option>
                  {padres.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <div>
                  <p className="text-xs text-neutral-600 mb-2">Icono</p>
                  <div className="grid grid-cols-8 gap-1 max-h-40 overflow-auto rounded-lg border p-2">
                    {ICONOS_CATEGORIAS_LISTA.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setForm({ ...form, icono: i })}
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                          form.icono === i
                            ? "bg-neutral-900 text-white"
                            : "hover:bg-neutral-100 text-neutral-700"
                        }`}
                        title={i}
                      >
                        <CategoriaIcon icono={i} size={16} />
                      </button>
                    ))}
                  </div>
                </div>
                <input type="number" className={input} placeholder="Orden" value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setAgregando(false); setEditando(null); }} className="px-3 py-1.5 text-xs rounded-lg border">
                  Cancelar
                </button>
                <button
                  disabled={isPending}
                  onClick={() => startTransition(async () => {
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
                  })}
                  className="px-3 py-1.5 text-xs rounded-lg bg-neutral-900 text-white disabled:opacity-50"
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
