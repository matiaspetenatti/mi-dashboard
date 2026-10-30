"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import { agregarFaltantesMenu } from "../actions/lista";
import {
  actualizarSlot,
  alternarSlotHecho,
  eliminarSlot,
  guardarMenuSemana,
  limpiarSemana,
} from "../actions/menu";
import {
  MOMENTOS,
  etiquetaMomento,
  type VistaComida,
} from "../constantes";
import {
  esHoy,
  etiquetaDiaCorto,
  etiquetaDiaLargo,
  rangoSemana,
  tituloSemana,
} from "../lib/semana";
import type {
  MomentoMenu,
  RecetaComida,
  SlotMenuComida,
} from "../schema";
import {
  CAMPO,
  CAMPO_SELECT,
  CAMPO_TEXTAREA,
  Campo,
  Chip,
  Etiqueta,
} from "./campos";

type SlotEditando = { dia: string; momento: MomentoMenu };

function enlaceSemana(semana: string, vista: VistaComida = "menu") {
  return `/comida?vista=${vista}&semana=${semana}`;
}

function sumarSemana(semana: string, dias: number) {
  const [anio, mes, dia] = semana.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias))
    .toISOString()
    .slice(0, 10);
}

function SlotDelDia({
  dia,
  momento,
  slot,
  hoy,
  pendiente,
  onEditar,
  onEliminar,
  onHecho,
}: {
  dia: string;
  momento: MomentoMenu;
  slot: SlotMenuComida | undefined;
  hoy: string;
  pendiente: boolean;
  onEditar: () => void;
  onEliminar: () => void;
  onHecho: (hecho: boolean) => void;
}) {
  const pasado = dia < hoy;

  return (
    <div
      className={cn(
        "rounded-xl border px-2.5 py-2 transition-colors",
        slot
          ? slot.hecho
            ? "border-success/25 bg-success-container/25"
            : "border-outline-variant/40 bg-surface-bright"
          : "border-dashed border-outline-variant/50 bg-transparent",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-pebble">
          {etiquetaMomento(momento)}
        </span>
        {slot && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onHecho(!slot.hecho)}
              disabled={pendiente}
              title={slot.hecho ? "Marcar como pendiente" : "Marcar como hecho"}
              aria-pressed={slot.hecho}
              className={cn(
                "grid size-6 place-items-center rounded-full transition-colors",
                slot.hecho
                  ? "bg-success text-on-success"
                  : "text-pebble hover:bg-surface-container hover:text-heading",
              )}
            >
              <Check size={11} />
            </button>
            <button
              type="button"
              onClick={onEditar}
              disabled={pendiente}
              title="Editar plato"
              className="grid size-6 place-items-center rounded-full text-pebble transition-colors hover:bg-surface-container hover:text-heading"
            >
              <Pencil size={11} />
            </button>
            <button
              type="button"
              onClick={onEliminar}
              disabled={pendiente}
              title="Quitar plato"
              className="grid size-6 place-items-center rounded-full text-pebble transition-colors hover:bg-error-container hover:text-on-error-container"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {slot ? (
        <button
          type="button"
          onClick={onEditar}
          className="mt-0.5 block w-full text-left"
        >
          <p
            className={cn(
              "line-clamp-2 text-xs font-bold leading-snug",
              slot.hecho
                ? "text-on-surface-variant line-through decoration-1"
                : "text-heading",
            )}
          >
            {slot.titulo || "Sin título"}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-pebble">
            {slot.minutos ? (
              <span className="inline-flex items-center gap-0.5">
                <Clock3 size={9} />
                {slot.minutos} min
              </span>
            ) : null}
            {slot.reutiliza && <span>· {slot.reutiliza}</span>}
          </p>
        </button>
      ) : (
        <button
          type="button"
          onClick={onEditar}
          disabled={pasado}
          className="mt-1 inline-flex w-full items-center gap-1 rounded-lg py-1 text-[10px] font-semibold text-pebble transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={10} />
          Agregar
        </button>
      )}
    </div>
  );
}

export function VistaMenu({
  semana,
  dias,
  menu,
  recetas,
  hoy,
}: {
  semana: string;
  dias: string[];
  menu: SlotMenuComida[];
  recetas: RecetaComida[];
  hoy: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, iniciar] = useTransition();
  const [generando, setGenerando] = useState(false);
  const [mensajes, setMensajes] = useState(0);
  const [momentos, setMomentos] = useState<Set<MomentoMenu>>(
    () => new Set(["almuerzo", "cena"]),
  );
  const [nota, setNota] = useState("");
  const [editando, setEditando] = useState<SlotEditando | null>(null);
  const [limpiarAbierto, setLimpiarAbierto] = useState(false);

  const porDia = useMemo(() => {
    const mapa = new Map<string, Map<MomentoMenu, SlotMenuComida>>();
    for (const dia of dias) mapa.set(dia, new Map());
    for (const slot of menu) {
      mapa.get(slot.dia)?.set(slot.momento, slot);
    }
    return mapa;
  }, [dias, menu]);

  const planificados = menu.length;
  const hechos = menu.filter((slot) => slot.hecho).length;

  const slotEditando = useMemo(() => {
    if (!editando) return null;
    return porDia.get(editando.dia)?.get(editando.momento) ?? null;
  }, [editando, porDia]);

  const recetaDelSlot = useMemo(() => {
    if (!slotEditando?.recetaId) return null;
    return recetas.find((receta) => receta.id === slotEditando.recetaId) ?? null;
  }, [slotEditando, recetas]);

  function alternarMomento(momento: MomentoMenu) {
    setMomentos((actual) => {
      const copia = new Set(actual);
      if (copia.has(momento)) copia.delete(momento);
      else copia.add(momento);
      return copia;
    });
  }

  const MENSAJES = [
    "Leyendo la despensa…",
    "Pensando la semana…",
    "Equilibrando platos y sobras…",
    "Ajustando tiempos de cocina…",
    "Cerrando el menú…",
  ];

  async function generar() {
    if (momentos.size === 0) {
      toast.warning("Elegí al menos un momento", {
        description: "Marcá qué comidas querés planificar.",
      });
      return;
    }

    setGenerando(true);
    setMensajes(0);
    const intervalo = setInterval(
      () => setMensajes((actual) => (actual + 1) % MENSAJES.length),
      5000,
    );

    try {
      const respuesta = await fetch("/api/comida/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semana,
          momentos: [...momentos],
          nota: nota || undefined,
        }),
      });

      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.error ?? "No se pudo generar el menú");
      }

      const generado = (datos.dias ?? []) as Array<{
        fecha: string;
        slots: Record<
          string,
          {
            titulo: string;
            minutos: number | null;
            ingredientes: string[];
            reutiliza: string | null;
          }
        >;
      }>;

      const diasEntrada = generado
        .map((dia) => ({
          fecha: dia.fecha,
          slots: Object.fromEntries(
            Object.entries(dia.slots ?? {}).map(([momento, slot]) => [
              momento,
              {
                titulo: slot.titulo,
                minutos: slot.minutos ?? null,
                ingredientes: slot.ingredientes ?? [],
                reutiliza: slot.reutiliza ?? null,
              },
            ]),
          ),
        }))
        .filter((dia) => Object.keys(dia.slots).length > 0);

      if (diasEntrada.length === 0) {
        throw new Error("La IA no devolvió platos para esta semana");
      }

      const guardado = await guardarMenuSemana(diasEntrada);
      if (!guardado.ok) throw new Error(guardado.error);

      toast.success("Menú generado", {
        description: `${guardado.agregados ?? diasEntrada.length} platos cargados en la semana.`,
      });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo generar el menú",
      );
    } finally {
      clearInterval(intervalo);
      setGenerando(false);
    }
  }

  function cambiarHecho(dia: string, momento: MomentoMenu, hecho: boolean) {
    iniciar(async () => {
      const resultado = await alternarSlotHecho(dia, momento, hecho);
      if (resultado.ok) router.refresh();
      else toast.error(resultado.error);
    });
  }

  function quitarSlot(dia: string, momento: MomentoMenu) {
    iniciar(async () => {
      const resultado = await eliminarSlot(dia, momento);
      if (resultado.ok) {
        toast.success("Plato quitado");
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function guardarSlot(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);

    iniciar(async () => {
      const resultado = await actualizarSlot(formData);
      if (resultado.ok) {
        toast.success("Menú actualizado");
        setEditando(null);
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function volcarFaltantes() {
    iniciar(async () => {
      const resultado = await agregarFaltantesMenu(semana);
      if (resultado.ok) {
        toast.success(
          resultado.agregados && resultado.agregados > 0
            ? `${resultado.agregados} ítems agregados a compras`
            : "No faltaba nada nuevo",
          { description: "Revisá la pestaña Compras." },
        );
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function limpiar() {
    iniciar(async () => {
      const resultado = await limpiarSemana(semana);
      if (resultado.ok) {
        setLimpiarAbierto(false);
        toast.success("Semana vacía");
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Navegación de semanas ──────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <Etiqueta>Plan semanal</Etiqueta>
          <h2 className="mt-0.5 flex items-center gap-2 text-xl font-bold tracking-tight text-heading">
            <CalendarDays size={18} className="text-primary" />
            {tituloSemana(semana, hoy)}
          </h2>
          <p className="text-xs text-on-surface-variant">
            {rangoSemana(semana)} · {planificados}{" "}
            {planificados === 1 ? "plato cargado" : "platos cargados"}
            {hechos > 0 ? ` · ${hechos} hechos` : ""}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={enlaceSemana(sumarSemana(semana, -7))}
            aria-label="Semana anterior"
            className="grid size-9 place-items-center rounded-full border border-outline-variant/60 text-on-surface-variant transition-colors hover:border-outline hover:text-heading"
          >
            <ChevronLeft size={16} />
          </Link>
          <Link
            href="/comida?vista=menu"
            className="rounded-full border border-outline-variant/60 px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:border-outline hover:text-heading"
          >
            Hoy
          </Link>
          <Link
            href={enlaceSemana(sumarSemana(semana, 7))}
            aria-label="Semana siguiente"
            className="grid size-9 place-items-center rounded-full border border-outline-variant/60 text-on-surface-variant transition-colors hover:border-outline hover:text-heading"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Generación con IA ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Etiqueta>Chef IA</Etiqueta>
            <h3 className="mt-0.5 flex items-center gap-2 text-lg font-bold tracking-tight text-heading">
              <Sparkles size={16} className="text-primary" />
              Armar la semana
            </h3>
            <p className="max-w-md text-xs text-on-surface-variant">
              La IA usa lo que tenés en la despensa y no repite los platos que
              ya están cargados. Después podés editar cada día.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={() => setLimpiarAbierto(true)}
              variant="ghost"
              size="sm"
              disabled={pendiente || planificados === 0}
            >
              <RotateCcw size={14} />
              Limpiar semana
            </Button>
            <Button
              type="button"
              onClick={volcarFaltantes}
              variant="secondary"
              size="sm"
              disabled={pendiente || planificados === 0}
            >
              <ShoppingBasket size={14} />
              Faltantes a compras
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {MOMENTOS.map((momento) => (
            <Chip
              key={momento.valor}
              activo={momentos.has(momento.valor)}
              onClick={() => alternarMomento(momento.valor)}
              disabled={generando}
            >
              {momento.label}
            </Chip>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Campo etiqueta="Pedido extra" ayuda="Opcional">
            <input
              value={nota}
              onChange={(evento) => setNota(evento.currentTarget.value)}
              maxLength={500}
              placeholder="Ej. comidas livianas, sin horno, aprovechar sobras…"
              className={CAMPO}
            />
          </Campo>
          <Button
            type="button"
            onClick={generar}
            disabled={generando || momentos.size === 0}
            className="bg-lime-voltage text-forest-ink hover:brightness-105"
          >
            {generando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wand2 size={16} />
            )}
            {generando ? MENSAJES[mensajes] : "Generar menú"}
          </Button>
        </div>

        {generando && (
          <p className="mt-2 text-[11px] text-pebble">
            Tarda entre 30 y 60 segundos. No cierres la pestaña.
          </p>
        )}
      </section>

      {/* ── Semana ─────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dias.map((dia) => {
          const slots = porDia.get(dia) ?? new Map();
          const hoyDia = esHoy(dia, hoy);

          return (
            <section
              key={dia}
              className={cn(
                "rounded-2xl border bg-card p-3 shadow-elevation-1",
                hoyDia
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : "border-outline-variant/40",
              )}
            >
              <header className="flex items-center justify-between gap-2 pb-2">
                <div>
                  <p className="text-xs font-extrabold capitalize text-heading">
                    {etiquetaDiaLargo(dia)}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-pebble">
                    {etiquetaDiaCorto(dia)}
                  </p>
                </div>
                {hoyDia && (
                  <span className="rounded-full bg-lime-voltage px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-forest-ink">
                    Hoy
                  </span>
                )}
              </header>

              <div className="space-y-1.5">
                {MOMENTOS.map((momento) => (
                  <SlotDelDia
                    key={momento.valor}
                    dia={dia}
                    momento={momento.valor}
                    slot={slots.get(momento.valor)}
                    hoy={hoy}
                    pendiente={pendiente}
                    onEditar={() =>
                      setEditando({ dia, momento: momento.valor })
                    }
                    onEliminar={() => quitarSlot(dia, momento.valor)}
                    onHecho={(hecho) =>
                      cambiarHecho(dia, momento.valor, hecho)
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {planificados === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-outline-variant/70 bg-surface-bright px-6 py-10 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-surface-container text-primary">
            <ChefHat size={20} />
          </span>
          <p className="text-sm font-bold text-heading">
            La semana está vacía
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-on-surface-variant">
            Generá el menú con IA o cargá los platos a mano desde cada día. Los
            ingredientes que uses se pueden volcar a la lista de compras.
          </p>
        </div>
      )}

      {/* ── Editar slot ────────────────────────────────────────────── */}
      <Dialogo
        abierto={editando !== null}
        onOpenChange={(abierto) => {
          if (!abierto && !pendiente) setEditando(null);
        }}
        titulo={
          slotEditando?.titulo
            ? "Editar plato"
            : editando
              ? `Agregar ${etiquetaMomento(editando.momento)}`
              : "Editar plato"
        }
        descripcion={
          editando
            ? `${etiquetaDiaLargo(editando.dia)} · ${etiquetaMomento(
                editando.momento,
              )}`
            : ""
        }
      >
        {editando && (
          <form onSubmit={guardarSlot} className="space-y-3">
            <input type="hidden" name="dia" value={editando.dia} />
            <input type="hidden" name="momento" value={editando.momento} />

            {recetas.length > 0 && (
              <Campo
                etiqueta="Usar receta del recetario"
                ayuda="Al elegirla se copian título, tiempo e ingredientes"
              >
                <select
                  name="recetaId"
                  defaultValue={slotEditando?.recetaId ?? ""}
                  className={CAMPO_SELECT}
                >
                  <option value="">Sin receta (título libre)</option>
                  {recetas.map((receta) => (
                    <option key={receta.id} value={receta.id}>
                      {receta.titulo}
                    </option>
                  ))}
                </select>
              </Campo>
            )}

            <Campo etiqueta="Título">
              <input
                name="titulo"
                defaultValue={slotEditando?.titulo ?? ""}
                maxLength={160}
                placeholder="Ej. Milanesas con puré"
                className={CAMPO}
              />
            </Campo>

            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Minutos">
                <input
                  name="minutos"
                  type="number"
                  min="1"
                  max="600"
                  defaultValue={slotEditando?.minutos ?? ""}
                  placeholder="Opcional"
                  className={CAMPO}
                />
              </Campo>
              <Campo etiqueta="Reutiliza" ayuda="Opcional">
                <input
                  name="reutiliza"
                  defaultValue={slotEditando?.reutiliza ?? ""}
                  maxLength={200}
                  placeholder="Ej. sobras del lunes"
                  className={CAMPO}
                />
              </Campo>
            </div>

            <Campo
              etiqueta="Ingredientes"
              ayuda="Uno por línea. Se usan para calcular los faltantes."
            >
              <textarea
                name="ingredientes"
                rows={4}
                defaultValue={(slotEditando?.ingredientes ?? []).join("\n")}
                placeholder={"500 g de pollo\n2 papas\n1 cebolla"}
                className={CAMPO_TEXTAREA}
              />
            </Campo>

            {recetaDelSlot && (
              <p className="text-[11px] text-pebble">
                Receta vinculada: {recetaDelSlot.titulo}. Si la elegís de nuevo,
                se vuelven a copiar sus datos.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditando(null)}
                disabled={pendiente}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pendiente}>
                {pendiente && <Loader2 size={15} className="animate-spin" />}
                Guardar plato
              </Button>
            </div>
          </form>
        )}
      </Dialogo>

      <Dialogo
        abierto={limpiarAbierto}
        onOpenChange={setLimpiarAbierto}
        titulo="Vaciar la semana"
        descripcion={`Se van a borrar los ${planificados} platos cargados en esta semana. El recetario y la lista de compras no se tocan.`}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setLimpiarAbierto(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={limpiar} disabled={pendiente}>
            {pendiente && <Loader2 size={15} className="animate-spin" />}
            Vaciar semana
          </Button>
        </div>
      </Dialogo>
    </div>
  );
}
