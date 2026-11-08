"use client"

import { useMemo, useState } from "react"
import {
  ChefHat,
  Clock,
  Plus,
  Search,
  Star,
  Users,
  UtensilsCrossed,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  TIPOS_RECETA,
  etiquetaTipoReceta,
  etiquetaTono,
} from "@/features/comida/constantes"
import { resumenFaltantes } from "@/features/comida/lib/inventario"
import { PanelReceta } from "@/features/comida/components/panel-receta"
import type { ItemComida, RecetaComida } from "@/server/db/schema"
import { cn } from "cn"

export function VistaRecetario({
  recetas,
  items,
  onNueva,
  onEditar,
}: {
  recetas: RecetaComida[]
  items: ItemComida[]
  onNueva: () => void
  onEditar: (receta: RecetaComida) => void
}) {
  const [busqueda, setBusqueda] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [soloFavoritas, setSoloFavoritas] = useState(false)
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return recetas.filter((receta) => {
      if (tipo !== "todos" && receta.tipo !== tipo) return false
      if (soloFavoritas && !receta.favorita) return false
      if (!texto) return true
      return (
        receta.titulo.toLowerCase().includes(texto) ||
        (receta.tips ?? "").toLowerCase().includes(texto) ||
        receta.ingredientes.some((ingrediente) =>
          ingrediente.nombre.toLowerCase().includes(texto),
        )
      )
    })
  }, [recetas, busqueda, tipo, soloFavoritas])

  const seleccionada =
    recetas.find((receta) => receta.id === seleccionadaId) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-outline-variant/60 bg-card p-3 shadow-elevation-1">
        <div className="relative min-w-48 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar receta o ingrediente..."
            className="h-9 pl-8 text-xs"
            aria-label="Buscar receta"
          />
        </div>

        <select
          value={tipo}
          onChange={(event) => setTipo(event.target.value)}
          className="h-9 rounded-xl border border-outline-variant/70 bg-card px-2 text-[10px] font-semibold text-heading outline-none focus:border-ring"
          aria-label="Filtrar por tipo"
        >
          <option value="todos">Todos los tipos</option>
          {TIPOS_RECETA.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.label}
            </option>
          ))}
        </select>

        <Button
          variant={soloFavoritas ? "default" : "outline"}
          size="sm"
          className="h-9 rounded-full px-3 text-[10px] font-bold"
          onClick={() => setSoloFavoritas((valor) => !valor)}
        >
          <Star
            className={cn("size-3.5", soloFavoritas && "fill-current")}
            aria-hidden="true"
          />
          Favoritas
        </Button>

        <Button
          size="sm"
          className="h-9 rounded-full px-4 text-[10px] font-bold"
          onClick={onNueva}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Nueva receta
        </Button>
      </div>

      {recetas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
            <ChefHat className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-heading">
              El recetario está vacío
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cargá tu primera receta con ingredientes y pasos.
            </p>
          </div>
          <Button onClick={onNueva}>
            <Plus className="size-4" aria-hidden="true" />
            Crear receta
          </Button>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/70 bg-card/40 px-5 py-12 text-center">
          <p className="text-xs font-bold text-heading">
            No hay recetas con ese filtro
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtradas.map((receta) => {
            const resumen = resumenFaltantes(receta.ingredientes, items)
            return (
              <button
                key={receta.id}
                type="button"
                onClick={() => setSeleccionadaId(receta.id)}
                className="flex flex-col rounded-3xl border border-outline-variant/60 bg-card p-4 text-left shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    {etiquetaTipoReceta(receta.tipo)}
                  </span>
                  {receta.favorita ? (
                    <Star
                      className="size-3.5 fill-current text-amber-400"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                <h3 className="mt-2 line-clamp-2 text-sm font-black leading-snug text-heading">
                  {receta.titulo}
                </h3>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  {etiquetaTono(receta.tono)} ·{" "}
                  {receta.porciones === 1
                    ? "1 porción"
                    : `${receta.porciones} porciones`}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" aria-hidden="true" />
                    {receta.minutos} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" aria-hidden="true" />
                    {receta.ingredientes.length} ing.
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                      resumen.faltan === 0
                        ? "bg-success-container text-success"
                        : "bg-warning-container text-warning",
                    )}
                  >
                    {resumen.texto}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
                    <UtensilsCrossed className="size-3" aria-hidden="true" />
                    {receta.vecesCocinada > 0
                      ? `${receta.vecesCocinada} vez/veces`
                      : "Sin cocinar"}
                  </span>
                  <span className="text-[9px] font-bold text-secondary">
                    Ver receta →
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {seleccionada ? (
        <PanelReceta
          receta={seleccionada}
          items={items}
          open
          onOpenChange={(open) => {
            if (!open) setSeleccionadaId(null)
          }}
          onEditar={() => {
            setSeleccionadaId(null)
            onEditar(seleccionada)
          }}
          onEliminada={() => setSeleccionadaId(null)}
        />
      ) : null}
    </div>
  )
}
