"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Clock3,
  Flame,
  Loader2,
  Martini,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Utensils,
  Wand2,
} from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { useToast } from "@/hooks/use-toast";
import { guardarReceta, cocinarReceta } from "../actions/recetas";
import {
  CATEGORIAS,
  MENSAJES_IA,
  TIPOS_COCINA,
  TONOS,
  etiquetaTipoReceta,
  etiquetaTono,
} from "../constantes";
import { formatearCantidad, normalizarNombre } from "../lib/cantidades";
import {
  porVencer,
  proponerDescuento,
  type DescuentoPropuesto,
} from "../lib/inventario";
import type { RecetaGenerada } from "../lib/ia";
import type { ItemComida, TonoReceta, TipoReceta } from "../schema";
import { Chip, Etiqueta, GrupoChips, Vacio, CAMPO, CAMPO_SELECT, Campo } from "./campos";

type Estado = "idle" | "cargando" | "listo" | "error";

function badgeTipoReceta(tipo: string) {
  return etiquetaTipoReceta(tipo);
}

export function ChefIa({
  items,
  seleccionInicial,
  hoy,
}: {
  items: ItemComida[];
  seleccionInicial: number[];
  hoy: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [guardando, iniciarGuardado] = useTransition();

  const ingredientes = useMemo(
    () => items.filter((item) => item.tipo === "ingrediente"),
    [items],
  );
  const utensilios = useMemo(
    () => items.filter((item) => item.tipo === "utensilio"),
    [items],
  );

  const [modo, setModo] = useState<"cocina" | "trago">("cocina");
  const [tipo, setTipo] = useState<TipoReceta>("cena");
  const [tono, setTono] = useState<TonoReceta>("sencillo");
  const [minutos, setMinutos] = useState("");
  const [porciones, setPorciones] = useState("2");
  const [nota, setNota] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [permitirExtras, setPermitirExtras] = useState(true);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(
    () =>
      new Set(
        seleccionInicial.filter((id) =>
          items.some((item) => item.id === id && item.tipo === "ingrediente"),
        ),
      ),
  );

  const [estado, setEstado] = useState<Estado>("idle");
  const [receta, setReceta] = useState<RecetaGenerada | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState(0);
  const [guardada, setGuardada] = useState<number | null>(null);
  const controller = useRef<AbortController | null>(null);

  const [descuentoAbierto, setDescuentoAbierto] = useState(false);
  const [descuentos, setDescuentos] = useState<DescuentoPropuesto[]>([]);

  useEffect(() => () => controller.current?.abort(), []);

  useEffect(() => {
    if (estado !== "cargando") return;
    const intervalo = setInterval(
      () => setMensaje((actual) => (actual + 1) % MENSAJES_IA.length),
      4500,
    );
    return () => clearInterval(intervalo);
  }, [estado]);

  const categoriasPresentes = useMemo(
    () =>
      CATEGORIAS.filter((opcion) =>
        ingredientes.some((item) => item.categoria === opcion.valor),
      ),
    [ingredientes],
  );

  const filtrados = useMemo(() => {
    const texto = normalizarNombre(busqueda);
    return ingredientes.filter((item) => {
      if (categoria !== "todas" && item.categoria !== categoria) return false;
      if (!texto) return true;
      return normalizarNombre(item.nombre).includes(texto);
    });
  }, [ingredientes, categoria, busqueda]);

  const vencen = useMemo(() => porVencer(items, hoy), [items, hoy]);

  function alternar(id: number) {
    setSeleccionados((actual) => {
      const copia = new Set(actual);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  function cambiarModo(nuevo: "cocina" | "trago") {
    setModo(nuevo);
    setTipo(nuevo === "trago" ? "trago" : "cena");
    setPorciones(nuevo === "trago" ? "1" : "2");
    setMinutos(nuevo === "trago" ? "5" : "");
    setTono("sencillo");
    setReceta(null);
    setGuardada(null);
    setEstado("idle");
  }

  async function generar(sorprender: boolean) {
    if (seleccionados.size === 0) {
      toast.warning("Elegí al menos un ingrediente", {
        description: "Marcá lo que tenés para cocinar y volvé a intentar.",
      });
      return;
    }

    controller.current?.abort();
    controller.current = new AbortController();
    setEstado("cargando");
    setError(null);
    setReceta(null);
    setGuardada(null);
    setMensaje(0);

    try {
      const respuesta = await fetch("/api/comida/receta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.current.signal,
        body: JSON.stringify({
          modo,
          tipo: modo === "trago" ? "trago" : tipo,
          tono,
          minutos: minutos ? Number(minutos) : null,
          porciones: Number(porciones) || 1,
          ingredientesIds: [...seleccionados],
          permitirExtras: modo === "trago" ? false : permitirExtras,
          sorprender,
          nota: nota || undefined,
        }),
      });

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(datos?.error ?? "No se pudo generar la receta");
      }

      setReceta(datos.receta as RecetaGenerada);
      setEstado("listo");
    } catch (fallo) {
      if (fallo instanceof DOMException && fallo.name === "AbortError") {
        setEstado("idle");
        return;
      }
      setError(
        fallo instanceof Error ? fallo.message : "No se pudo generar la receta",
      );
      setEstado("error");
    }
  }

  function cancelar() {
    controller.current?.abort();
    setEstado("idle");
  }

  function datosReceta(recetaGenerada: RecetaGenerada) {
    return {
      titulo: recetaGenerada.titulo,
      tipo: recetaGenerada.tipo,
      tono: recetaGenerada.tono,
      minutos: recetaGenerada.minutos,
      porciones: recetaGenerada.porciones,
      ingredientes: recetaGenerada.ingredientes,
      pasos: recetaGenerada.pasos,
      tips: recetaGenerada.tips,
      nutricion: recetaGenerada.nutricion,
      herramientas: recetaGenerada.herramientas,
      vaso: recetaGenerada.vaso,
      tecnica: recetaGenerada.tecnica,
      origen: "ia" as const,
      puntaje: 0,
    };
  }

  function guardar() {
    if (!receta) return;

    iniciarGuardado(async () => {
      const resultado = await guardarReceta(datosReceta(receta));
      if (resultado.ok) {
        setGuardada(resultado.id ?? null);
        toast.success("Receta guardada", {
          description: "Ya está en el recetario para repetirla cuando quieras.",
        });
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  function abrirDescuento() {
    if (!receta) return;
    const propuesta = proponerDescuento(receta.ingredientes, items);
    if (propuesta.length === 0) {
      toast.info("No hay stock para descontar", {
        description:
          "Los ingredientes de esta receta no coinciden con ítems de la despensa.",
      });
      return;
    }
    setDescuentos(propuesta);
    setDescuentoAbierto(true);
  }

  function confirmarCoccion() {
    if (!receta) return;

    iniciarGuardado(async () => {
      let id = guardada;

      if (!id) {
        const guardado = await guardarReceta(datosReceta(receta));
        if (!guardado.ok) {
          toast.error(guardado.error);
          return;
        }
        id = guardado.id ?? null;
        setGuardada(id);
      }

      if (!id) {
        toast.error("No se pudo guardar la receta");
        return;
      }

      const resultado = await cocinarReceta(
        id,
        descuentos
          .filter((descuento) => descuento.cantidad > 0)
          .map((descuento) => ({
            ingredienteId: descuento.ingredienteId,
            cantidad: descuento.cantidad,
          })),
      );

      if (resultado.ok) {
        setDescuentoAbierto(false);
        toast.success("¡Buen provecho!", {
          description: "Descontamos el stock confirmado del inventario.",
        });
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });
  }

  const esTrago = modo === "trago";

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
      {/* ── Configuración ───────────────────────────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 sm:p-5">
        <div>
          <Etiqueta>Asistente culinario</Etiqueta>
          <h2 className="mt-0.5 flex items-center gap-2 text-xl font-bold tracking-tight text-heading">
            <ChefHat size={18} className="text-primary" />
            Chef IA
          </h2>
          <p className="text-xs text-on-surface-variant">
            Elegí lo que tenés y te devuelvo una receta con cantidades y tiempos.
          </p>
        </div>

        <div className="flex gap-1 rounded-full border border-outline-variant/40 bg-surface-container-low p-1">
          <button
            type="button"
            onClick={() => cambiarModo("cocina")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              !esTrago
                ? "bg-inverse-surface text-inverse-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            <Flame size={13} />
            Cocina
          </button>
          <button
            type="button"
            onClick={() => cambiarModo("trago")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              esTrago
                ? "bg-inverse-surface text-inverse-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            <Martini size={13} />
            Tragos
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <Etiqueta>
              Ingredientes ({seleccionados.size})
            </Etiqueta>
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setSeleccionados(new Set(ingredientes.map((i) => i.id)))}
                className="text-primary hover:underline"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setSeleccionados(new Set())}
                className="text-pebble hover:underline"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="relative mt-1.5">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pebble"
            />
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.currentTarget.value)}
              placeholder="Buscar en la despensa…"
              aria-label="Buscar ingrediente"
              className="h-9 w-full rounded-xl border border-outline-variant/60 bg-surface-container-low pl-8 pr-3 text-xs text-heading placeholder:text-pebble focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {ingredientes.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-outline-variant/60 px-3 py-6 text-center text-xs text-on-surface-variant">
              Cargá ingredientes en la despensa para empezar.
            </p>
          ) : (
            <>
              <GrupoChips className="mt-2">
                <Chip
                  activo={categoria === "todas"}
                  onClick={() => setCategoria("todas")}
                  className="px-2.5 py-1 text-[10px]"
                >
                  Todas
                </Chip>
                {categoriasPresentes.map((opcion) => (
                  <Chip
                    key={opcion.valor}
                    activo={categoria === opcion.valor}
                    onClick={() => setCategoria(opcion.valor)}
                    className="px-2.5 py-1 text-[10px]"
                  >
                    {opcion.emoji}
                  </Chip>
                ))}
              </GrupoChips>

              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
                {filtrados.map((item) => {
                  const activo = seleccionados.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => alternar(item.id)}
                      aria-pressed={activo}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors",
                        activo
                          ? "border-primary/40 bg-primary-container/40 text-heading"
                          : "border-transparent text-on-surface-variant hover:bg-surface-container-low",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded border text-[9px] font-bold",
                            activo
                              ? "border-primary bg-primary text-on-primary"
                              : "border-outline-variant text-transparent",
                          )}
                        >
                          ✓
                        </span>
                        <span className="truncate font-semibold">{item.nombre}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-pebble">
                        {formatearCantidad(item.cantidad, item.unidad)}
                      </span>
                    </button>
                  );
                })}
                {filtrados.length === 0 && (
                  <p className="py-4 text-center text-xs text-pebble">
                    Sin resultados.
                  </p>
                )}
              </div>
            </>
          )}

          {vencen.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSeleccionados((actual) => {
                  const copia = new Set(actual);
                  for (const item of vencen) copia.add(item.id);
                  return copia;
                })
              }
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-tertiary hover:underline"
            >
              <Clock3 size={11} />
              Sumar los {vencen.length} que vencen pronto
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Tipo">
            <select
              value={esTrago ? "trago" : tipo}
              onChange={(evento) => setTipo(evento.currentTarget.value as TipoReceta)}
              disabled={esTrago}
              className={CAMPO_SELECT}
            >
              {esTrago ? (
                <option value="trago">Trago</option>
              ) : (
                TIPOS_COCINA.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {etiquetaTipoReceta(opcion)}
                  </option>
                ))
              )}
            </select>
          </Campo>
          <Campo etiqueta="Tono">
            <select
              value={tono}
              onChange={(evento) => setTono(evento.currentTarget.value as TonoReceta)}
              className={CAMPO_SELECT}
            >
              {TONOS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Minutos máx." ayuda="Opcional">
            <input
              value={minutos}
              onChange={(evento) => setMinutos(evento.currentTarget.value)}
              type="number"
              min="5"
              max="600"
              placeholder="Libre"
              className={CAMPO}
            />
          </Campo>
          <Campo etiqueta={esTrago ? "Tragos" : "Porciones"}>
            <input
              value={porciones}
              onChange={(evento) => setPorciones(evento.currentTarget.value)}
              type="number"
              min="1"
              max="24"
              disabled={esTrago}
              className={CAMPO}
            />
          </Campo>
        </div>

        {!esTrago && (
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-outline-variant/50 bg-surface-bright p-2.5">
            <input
              type="checkbox"
              checked={permitirExtras}
              onChange={(evento) => setPermitirExtras(evento.currentTarget.checked)}
              className="mt-0.5 size-3.5 accent-[var(--primary)]"
            />
            <span className="text-[11px] leading-snug text-on-surface-variant">
              <span className="font-bold text-heading">Puede sumar hasta 2 ingredientes extra</span>
              <br />
              Si falta algo para cerrar el plato, que lo proponga como opcional.
            </span>
          </label>
        )}

        {esTrago && (
          <div className="rounded-xl border border-outline-variant/50 bg-surface-bright p-2.5 text-[11px] leading-snug text-on-surface-variant">
            <span className="font-bold text-heading">Herramientas disponibles</span>
            <br />
            {utensilios.length > 0
              ? utensilios.map((item) => item.nombre).join(", ")
              : "No cargaste utensilios: la IA va a usar solo técnicas sin herramientas."}
          </div>
        )}

        <Campo etiqueta="Pedido extra" ayuda="Opcional">
          <textarea
            value={nota}
            onChange={(evento) => setNota(evento.currentTarget.value)}
            rows={2}
            maxLength={500}
            placeholder="Ej. sin horno, con lo que hay, algo liviano…"
            className="min-h-16 w-full resize-y rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2 text-sm text-heading placeholder:text-pebble focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </Campo>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => generar(false)}
            disabled={estado === "cargando" || seleccionados.size === 0}
            className="w-full bg-lime-voltage text-forest-ink hover:brightness-105"
          >
            {estado === "cargando" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wand2 size={16} />
            )}
            {estado === "cargando" ? "Cocinando…" : "Generar receta"}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => generar(true)}
              disabled={estado === "cargando" || seleccionados.size === 0}
              className="flex-1"
            >
              <Sparkles size={15} />
              Sorprendeme
            </Button>
            {estado === "cargando" && (
              <Button type="button" variant="ghost" onClick={cancelar}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── Resultado ──────────────────────────────────────────────── */}
      <section className="min-w-0">
        {estado === "idle" && (
          <Vacio
            icono={<Sparkles size={20} />}
            titulo="Tu próxima receta aparece acá"
            descripcion="Marcá los ingredientes que tenés, elegí tipo y tono, y generá. También podés dejar que la IA te sorprenda con lo que hay en la despensa."
          />
        )}

        {estado === "cargando" && (
          <div className="flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-2xl border border-outline-variant/40 bg-card p-8 text-center shadow-elevation-1">
            <span className="relative grid size-14 place-items-center rounded-full bg-primary-container text-on-primary-container">
              <ChefHat size={24} />
              <span className="absolute inset-0 animate-ping rounded-full border border-primary/30" />
            </span>
            <p className="text-sm font-bold text-heading">{MENSAJES_IA[mensaje]}</p>
            <p className="max-w-xs text-xs text-on-surface-variant">
              La generación tarda entre 20 y 45 segundos. Podés cancelar sin
              perder lo que cargaste.
            </p>
            <div className="mt-1 h-1.5 w-48 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full w-1/2 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
            </div>
          </div>
        )}

        {estado === "error" && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border border-error/30 bg-error-container/30 p-8 text-center">
            <p className="text-sm font-bold text-on-error-container">
              No pudimos generar la receta
            </p>
            <p className="max-w-md text-xs text-on-surface-variant">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => generar(false)}>
              <RotateCcw size={14} />
              Reintentar
            </Button>
          </div>
        )}

        {estado === "listo" && receta && (
          <article className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 sm:p-6">
            <header className="flex flex-col gap-3 border-b border-outline-variant/40 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={receta.tipo === "trago" ? "tertiary" : "primary"}>
                    {receta.tipo === "trago" ? (
                      <Martini size={11} />
                    ) : (
                      <Utensils size={11} />
                    )}
                    {badgeTipoReceta(receta.tipo)}
                  </Badge>
                  <Badge variant="neutral">{etiquetaTono(receta.tono)}</Badge>
                  <Badge variant="outline">
                    <Clock3 size={11} />
                    {receta.minutos} min
                  </Badge>
                  {!esTrago && (
                    <Badge variant="outline">{receta.porciones} porciones</Badge>
                  )}
                </div>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-heading">
                  {receta.titulo}
                </h2>
                {guardada && (
                  <p className="mt-1 text-[11px] font-semibold text-success">
                    Guardada en el recetario
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={guardar}
                  disabled={guardando || guardada !== null}
                >
                  {guardando ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {guardada ? "Guardada" : "Guardar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => generar(false)}>
                  <RotateCcw size={14} />
                  Otra
                </Button>
              </div>
            </header>

            {esTrago && (receta.vaso || receta.tecnica || receta.herramientas.length > 0) && (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {receta.vaso && (
                  <div className="rounded-xl bg-surface-bright p-3">
                    <Etiqueta>Vaso</Etiqueta>
                    <p className="mt-0.5 text-sm font-semibold text-heading">
                      {receta.vaso}
                    </p>
                  </div>
                )}
                {receta.tecnica && (
                  <div className="rounded-xl bg-surface-bright p-3">
                    <Etiqueta>Técnica</Etiqueta>
                    <p className="mt-0.5 text-sm font-semibold text-heading">
                      {receta.tecnica}
                    </p>
                  </div>
                )}
                {receta.herramientas.length > 0 && (
                  <div className="rounded-xl bg-surface-bright p-3">
                    <Etiqueta>Herramientas</Etiqueta>
                    <p className="mt-0.5 text-sm font-semibold text-heading">
                      {receta.herramientas.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-pebble">
                  Ingredientes
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {receta.ingredientes.map((ingrediente, indice) => (
                    <li
                      key={`${ingrediente.nombre}-${indice}`}
                      className="flex items-start justify-between gap-2 border-b border-outline-variant/25 pb-1.5 text-xs last:border-0"
                    >
                      <span className="text-charcoal">
                        {ingrediente.nombre}
                        {ingrediente.opcional && (
                          <span className="ml-1 text-[9px] font-bold uppercase text-pebble">
                            opcional
                          </span>
                        )}
                        {ingrediente.detalle && (
                          <span className="block text-[10px] text-pebble">
                            {ingrediente.detalle}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-bold text-heading">
                        {formatearCantidad(ingrediente.cantidad, ingrediente.unidad)}
                      </span>
                    </li>
                  ))}
                </ul>

                {receta.nutricion && (
                  <div className="mt-4 rounded-xl border border-outline-variant/50 bg-surface-bright p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Etiqueta>Nutrición</Etiqueta>
                      <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Estimado
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-extrabold text-heading">
                      {receta.nutricion.kcal} kcal
                      <span className="ml-1 text-[10px] font-medium text-pebble">
                        por porción
                      </span>
                    </p>
                    <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[10px]">
                      <div>
                        <p className="font-bold text-heading">
                          {receta.nutricion.proteinas} g
                        </p>
                        <p className="text-pebble">Proteínas</p>
                      </div>
                      <div>
                        <p className="font-bold text-heading">
                          {receta.nutricion.carbos} g
                        </p>
                        <p className="text-pebble">Carbos</p>
                      </div>
                      <div>
                        <p className="font-bold text-heading">
                          {receta.nutricion.grasas} g
                        </p>
                        <p className="text-pebble">Grasas</p>
                      </div>
                      <div>
                        <p className="font-bold text-heading">
                          {receta.nutricion.fibra} g
                        </p>
                        <p className="text-pebble">Fibra</p>
                      </div>
                      <div>
                        <p className="font-bold text-heading">
                          {receta.nutricion.azucares} g
                        </p>
                        <p className="text-pebble">Azúcares</p>
                      </div>
                      <div>
                        <p className="font-bold text-heading">
                          {receta.nutricion.sodio} g
                        </p>
                        <p className="text-pebble">Sodio</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-pebble">
                  Preparación
                </h3>
                <ol className="mt-2 space-y-2.5">
                  {receta.pasos.map((paso, indice) => (
                    <li key={indice} className="flex gap-2.5">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-inverse-surface text-[10px] font-bold text-inverse-on-surface">
                        {indice + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-charcoal">{paso}</p>
                    </li>
                  ))}
                </ol>

                {receta.tips && (
                  <div className="mt-4 rounded-xl border border-tertiary/25 bg-tertiary-container/25 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-tertiary-container">
                      Tip del chef
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-charcoal">
                      {receta.tips}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-outline-variant/40 pt-3">
                  <Button
                    size="sm"
                    onClick={abrirDescuento}
                    disabled={guardando}
                    className="bg-lime-voltage text-forest-ink hover:brightness-105"
                  >
                    <Utensils size={14} />
                    Cocinar y descontar stock
                  </Button>
                  <p className="self-center text-[10px] text-pebble">
                    Siempre confirmás las cantidades antes de descontar.
                  </p>
                </div>
              </div>
            </div>
          </article>
        )}
      </section>

      <Dialogo
        abierto={descuentoAbierto}
        onOpenChange={setDescuentoAbierto}
        titulo="Confirmar descuento de stock"
        descripcion="Ajustá las cantidades que se van a descontar. Podés poner 0 para no tocar un ingrediente."
      >
        <div className="space-y-2">
          {descuentos.map((descuento, indice) => (
            <div
              key={descuento.ingredienteId}
              className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/50 bg-surface-bright px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-heading">
                  {descuento.nombre}
                </p>
                <p className="text-[10px] text-pebble">
                  Tenés {formatearCantidad(descuento.stockActual, descuento.unidad)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={descuento.cantidad}
                  onChange={(evento) => {
                    const valor = Number(evento.currentTarget.value);
                    setDescuentos((actual) =>
                      actual.map((item, posicion) =>
                        posicion === indice
                          ? {
                              ...item,
                              cantidad: Number.isFinite(valor) ? valor : 0,
                              restante: Math.max(
                                0,
                                item.stockActual - (Number.isFinite(valor) ? valor : 0),
                              ),
                            }
                          : item,
                      ),
                    );
                  }}
                  className="h-8 w-20 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 text-right text-sm font-semibold text-heading focus:border-primary focus:outline-none"
                />
                <span className="text-[10px] font-semibold text-pebble">
                  {descuento.unidad}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setDescuentoAbierto(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button onClick={confirmarCoccion} disabled={guardando}>
            {guardando && <Loader2 size={15} className="animate-spin" />}
            Confirmar y cocinar
          </Button>
        </div>
      </Dialogo>
    </div>
  );
}
