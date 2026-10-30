"use client";

import { useMemo, useState } from "react";
import {
  ChefHat,
  Clock3,
  Heart,
  Martini,
  Plus,
  Search,
  Sparkles,
  Utensils,
} from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TIPOS_RECETA,
  etiquetaTipoReceta,
  etiquetaTono,
} from "../constantes";
import { normalizarNombre } from "../lib/cantidades";
import { resumenFaltantes } from "../lib/inventario";
import type { ItemComida, RecetaComida } from "../schema";
import { Chip, Etiqueta, GrupoChips, Vacio } from "./campos";
import { DetalleReceta } from "./detalle-receta";
import { FormularioReceta } from "./formulario-receta";

type Orden = "recientes" | "cocinadas" | "rapidas";

const ORDENES: Array<{ valor: Orden; label: string }> = [
  { valor: "recientes", label: "Recientes" },
  { valor: "cocinadas", label: "Más cocinadas" },
  { valor: "rapidas", label: "Más rápidas" },
];

function TarjetaReceta({
  receta,
  items,
  onAbrir,
}: {
  receta: RecetaComida;
  items: ItemComida[];
  onAbrir: () => void;
}) {
  const esTrago = receta.tipo === "trago";
  const faltantes = resumenFaltantes(receta.ingredientes, items);
  const completa = faltantes.faltan === 0;

  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border bg-card p-4 text-left shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevation-2",
        receta.favorita
          ? "border-error/30"
          : "border-outline-variant/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            esTrago
              ? "bg-tertiary-container text-on-tertiary-container"
              : "bg-primary-container text-on-primary-container",
          )}
        >
          {esTrago ? <Martini size={16} /> : <Utensils size={16} />}
        </span>
        {receta.favorita && (
          <Heart
            size={14}
            className="shrink-0 text-error"
            fill="currentColor"
            aria-label="Favorita"
          />
        )}
      </div>

      <button
        type="button"
        onClick={onAbrir}
        className="mt-2 text-left"
      >
        <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-heading group-hover:text-primary">
          {receta.titulo}
        </h3>
      </button>

      <p className="mt-1 line-clamp-1 text-[11px] text-on-surface-variant">
        {etiquetaTipoReceta(receta.tipo)} · {etiquetaTono(receta.tono)}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">
          <Clock3 size={11} />
          {receta.minutos} min
        </Badge>
        {!esTrago && (
          <Badge variant="neutral">{receta.porciones} porc.</Badge>
        )}
        {receta.origen === "ia" && <Badge variant="outline">IA</Badge>}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-outline-variant/30 pt-2.5">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide",
            completa ? "text-success" : "text-on-warning-container",
          )}
        >
          {faltantes.texto}
        </span>
        <Button size="sm" variant="ghost" onClick={onAbrir}>
          Ver receta
        </Button>
      </div>
    </article>
  );
}

export function VistaRecetario({
  recetas,
  items,
}: {
  recetas: RecetaComida[];
  items: ItemComida[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState<string>("todas");
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [orden, setOrden] = useState<Orden>("recientes");
  const [abiertaId, setAbiertaId] = useState<number | null>(null);
  const [nuevaAbierta, setNuevaAbierta] = useState(false);
  const [editando, setEditando] = useState<RecetaComida | null>(null);

  const tiposPresentes = useMemo(
    () => TIPOS_RECETA.filter((opcion) => recetas.some((r) => r.tipo === opcion.valor)),
    [recetas],
  );

  const filtradas = useMemo(() => {
    const texto = normalizarNombre(busqueda);

    const resultado = recetas.filter((receta) => {
      if (tipo !== "todas" && receta.tipo !== tipo) return false;
      if (soloFavoritas && !receta.favorita) return false;
      if (!texto) return true;
      const enTitulo = normalizarNombre(receta.titulo).includes(texto);
      const enIngredientes = receta.ingredientes.some((ingrediente) =>
        normalizarNombre(ingrediente.nombre).includes(texto),
      );
      return enTitulo || enIngredientes;
    });

    if (orden === "cocinadas") {
      return [...resultado].sort((a, b) => b.vecesCocinada - a.vecesCocinada);
    }
    if (orden === "rapidas") {
      return [...resultado].sort((a, b) => a.minutos - b.minutos);
    }
    return resultado;
  }, [recetas, busqueda, tipo, soloFavoritas, orden]);

  const abierta = useMemo(
    () => recetas.find((receta) => receta.id === abiertaId) ?? null,
    [recetas, abiertaId],
  );

  const favoritas = recetas.filter((receta) => receta.favorita).length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Etiqueta>Recetario</Etiqueta>
            <h2 className="mt-0.5 flex items-center gap-2 text-xl font-bold tracking-tight text-heading">
              <ChefHat size={18} className="text-primary" />
              Tus recetas
            </h2>
            <p className="text-xs text-on-surface-variant">
              {recetas.length}{" "}
              {recetas.length === 1 ? "receta guardada" : "recetas guardadas"}
              {favoritas > 0 ? ` · ${favoritas} favoritas` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pebble"
              />
              <input
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.currentTarget.value)}
                placeholder="Buscar receta o ingrediente…"
                aria-label="Buscar receta"
                className="h-9 w-full rounded-full border border-outline-variant/60 bg-surface-container-low pl-9 pr-3 text-sm text-heading placeholder:text-pebble focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-64"
              />
            </div>
            <Button
              onClick={() => setNuevaAbierta(true)}
              size="sm"
              className="bg-lime-voltage text-forest-ink hover:brightness-105"
            >
              <Plus size={15} />
              Nueva receta
            </Button>
          </div>
        </div>

        {recetas.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <GrupoChips>
              <Chip activo={tipo === "todas"} onClick={() => setTipo("todas")}>
                Todas
              </Chip>
              {tiposPresentes.map((opcion) => (
                <Chip
                  key={opcion.valor}
                  activo={tipo === opcion.valor}
                  onClick={() => setTipo(opcion.valor)}
                >
                  {opcion.valor === "trago" ? (
                    <Martini size={11} />
                  ) : (
                    <Utensils size={11} />
                  )}
                  {opcion.label}
                </Chip>
              ))}
              <Chip
                activo={soloFavoritas}
                onClick={() => setSoloFavoritas((actual) => !actual)}
              >
                <Heart
                  size={11}
                  fill={soloFavoritas ? "currentColor" : "none"}
                />
                Favoritas
              </Chip>
            </GrupoChips>

            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
              Orden
              <select
                value={orden}
                onChange={(evento) => setOrden(evento.currentTarget.value as Orden)}
                className="h-8 cursor-pointer rounded-full border border-outline-variant/60 bg-surface-container-low px-2.5 text-[11px] font-semibold text-heading focus:border-primary focus:outline-none"
              >
                {ORDENES.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      {recetas.length === 0 ? (
        <Vacio
          icono={<ChefHat size={20} />}
          titulo="El recetario está vacío"
          descripcion="Generá una receta con el Chef IA o cargá la tuya a mano. Después podés repetirla y descontar el stock con un clic."
          accion={
            <Button onClick={() => setNuevaAbierta(true)} size="sm">
              <Plus size={15} />
              Cargar la primera receta
            </Button>
          }
        />
      ) : filtradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant/60 px-4 py-10 text-center text-sm text-on-surface-variant">
          No hay recetas que coincidan con los filtros.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((receta) => (
            <TarjetaReceta
              key={receta.id}
              receta={receta}
              items={items}
              onAbrir={() => setAbiertaId(receta.id)}
            />
          ))}
        </div>
      )}

      {filtradas.length > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-pebble">
          <Sparkles size={12} />
          Las recetas generadas por IA quedan marcadas y se pueden editar como
          cualquier otra.
        </p>
      )}

      {abierta && (
        <DetalleReceta
          key={abierta.id}
          receta={abierta}
          items={items}
          abierto
          onOpenChange={(valor) => {
            if (!valor) setAbiertaId(null);
          }}
          onEditar={() => {
            setAbiertaId(null);
            setEditando(abierta);
          }}
        />
      )}

      <FormularioReceta
        abierto={nuevaAbierta}
        onOpenChange={setNuevaAbierta}
      />

      {editando && (
        <FormularioReceta
          key={editando.id}
          abierto
          onOpenChange={(valor) => {
            if (!valor) setEditando(null);
          }}
          receta={editando}
        />
      )}
    </div>
  );
}
