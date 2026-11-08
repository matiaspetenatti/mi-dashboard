"use client"

import { useState } from "react"
import {
  AlertTriangle,
  ChefHat,
  Package,
  Plus,
  ShoppingBasket,
} from "lucide-react"

import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { DialogoItem } from "@/features/comida/components/dialogo-item"
import { DialogoReceta } from "@/features/comida/components/dialogo-receta"
import { VistaCompras } from "@/features/comida/components/vista-compras"
import { VistaDespensa } from "@/features/comida/components/vista-despensa"
import { VistaMenu } from "@/features/comida/components/vista-menu"
import { VistaRecetario } from "@/features/comida/components/vista-recetario"
import type { VistaComida, WorkspaceComida } from "@/features/comida/types"
import { formatMonto } from "@/lib/format"
import type { ItemComida, RecetaComida } from "@/server/db/schema"
import { cn } from "cn"

export function WorkspaceComida({
  workspace,
  vista,
  onCambiarVista,
  onCambiarSemana,
}: {
  workspace: WorkspaceComida
  vista: VistaComida
  onCambiarVista: (vista: VistaComida) => void
  onCambiarSemana: (semana: string) => void
}) {
  const [itemDialogoOpen, setItemDialogoOpen] = useState(false)
  const [itemEditando, setItemEditando] = useState<ItemComida | null>(null)
  const [recetaDialogoOpen, setRecetaDialogoOpen] = useState(false)
  const [recetaEditando, setRecetaEditando] = useState<RecetaComida | null>(
    null,
  )

  function nuevoItem() {
    setItemEditando(null)
    setItemDialogoOpen(true)
  }

  function editarItem(item: ItemComida) {
    setItemEditando(item)
    setItemDialogoOpen(true)
  }

  function nuevaReceta() {
    setRecetaEditando(null)
    setRecetaDialogoOpen(true)
  }

  function editarReceta(receta: RecetaComida) {
    setRecetaEditando(receta)
    setRecetaDialogoOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Cocina"
        title="Comida"
        description="Despensa, recetario, menú semanal y lista de compras."
        meta={`${workspace.kpis.items} ingredientes`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={nuevoItem}>
              <Package className="size-4" aria-hidden="true" />
              Agregar ítem
            </Button>
            <Button onClick={nuevaReceta}>
              <Plus className="size-4" aria-hidden="true" />
              Nueva receta
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica
          icon={Package}
          label="Despensa"
          value={String(workspace.kpis.items)}
          detalle="Ingredientes cargados"
        />
        <Metrica
          icon={AlertTriangle}
          label="Por vencer"
          value={String(workspace.kpis.porVencer)}
          detalle="Próximos 3 días"
        />
        <Metrica
          icon={ChefHat}
          label="Recetas"
          value={String(workspace.kpis.recetas)}
          detalle="En el recetario"
        />
        <Metrica
          icon={ShoppingBasket}
          label="Compras"
          value={String(workspace.kpis.comprasPendientes)}
          detalle={`${formatMonto(workspace.kpis.totalCompraCentavos)} estimado`}
        />
      </section>

      <div className="flex w-fit flex-wrap items-center gap-1 rounded-full border border-outline-variant/60 bg-card p-1">
        {(
          [
            ["despensa", "Despensa"],
            ["recetario", "Recetario"],
            ["menu", "Menú"],
            ["compras", "Compras"],
          ] as const
        ).map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            onClick={() => onCambiarVista(valor)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[10px] font-bold transition-colors",
              vista === valor
                ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                : "text-muted-foreground hover:text-heading",
            )}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {vista === "despensa" ? (
        <VistaDespensa
          items={workspace.items}
          hoy={workspace.hoy}
          onNuevo={nuevoItem}
          onEditar={editarItem}
        />
      ) : null}

      {vista === "recetario" ? (
        <VistaRecetario
          recetas={workspace.recetas}
          items={workspace.items}
          onNueva={nuevaReceta}
          onEditar={editarReceta}
        />
      ) : null}

      {vista === "menu" ? (
        <VistaMenu
          dias={workspace.dias}
          menu={workspace.menu}
          recetas={workspace.recetas}
          semana={workspace.semana}
          hoy={workspace.hoy}
          onCambiarSemana={onCambiarSemana}
        />
      ) : null}

      {vista === "compras" ? <VistaCompras lista={workspace.lista} /> : null}

      {itemDialogoOpen ? (
        <DialogoItem
          key={itemEditando?.id ?? "nuevo"}
          open
          onOpenChange={(open) => {
            if (!open) {
              setItemDialogoOpen(false)
              setItemEditando(null)
            }
          }}
          item={itemEditando}
        />
      ) : null}

      {recetaDialogoOpen ? (
        <DialogoReceta
          key={recetaEditando?.id ?? "nueva"}
          open
          onOpenChange={(open) => {
            if (!open) {
              setRecetaDialogoOpen(false)
              setRecetaEditando(null)
            }
          }}
          receta={recetaEditando}
        />
      ) : null}

    </div>
  )
}

function Metrica({
  icon: Icon,
  label,
  value,
  detalle,
}: {
  icon: typeof Package
  label: string
  value: string
  detalle: string
}) {
  return (
    <article className="rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-secondary" aria-hidden="true" />
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="tabular mt-3 text-2xl font-black leading-none text-heading">
        {value}
      </p>
      <p className="mt-2 truncate text-[9px] text-muted-foreground">{detalle}</p>
    </article>
  )
}
