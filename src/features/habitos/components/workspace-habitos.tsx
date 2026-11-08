"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Activity, Check, Flame, GitBranch, Plus } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { DetalleHabito } from "@/features/habitos/components/detalle-habito"
import { DialogoHabito } from "@/features/habitos/components/dialogo-habito"
import { GithubActividad } from "@/features/habitos/components/github-actividad"
import { TarjetaHabito } from "@/features/habitos/components/tarjeta-habito"
import type { VistaHabitos } from "@/features/habitos/constantes"
import {
  alternarActivoHabito,
  registrarHabito,
} from "@/features/habitos/server/functions"
import type {
  HabitoConEstado,
  WorkspaceHabitos,
} from "@/features/habitos/types"
import type { Habito } from "@/server/db/schema"
import { cn } from "cn"

const FILTROS: Array<{ valor: VistaHabitos; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Activos" },
  { valor: "bueno", etiqueta: "Buenos" },
  { valor: "malo", etiqueta: "A erradicar" },
  { valor: "archivados", etiqueta: "Archivados" },
]

export function WorkspaceHabitos({
  workspace,
}: {
  workspace: WorkspaceHabitos
}) {
  const queryClient = useQueryClient()
  const [filtro, setFiltro] = useState<VistaHabitos>("todos")
  const [dialogoOpen, setDialogoOpen] = useState(false)
  const [habitoEditando, setHabitoEditando] = useState<Habito | null>(null)
  const [detalleId, setDetalleId] = useState<number | null>(null)

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["habitos"] })
  }

  const registrar = useMutation({
    mutationFn: (habito: HabitoConEstado) =>
      registrarHabito({
        data: {
          habitoId: habito.id,
          fecha: workspace.hoy,
          completado: !habito.completadoHoy,
        },
      }),
    onSuccess: () => {
      invalidar()
    },
    onError: () => toast.error("No se pudo guardar el check-in"),
  })

  const archivar = useMutation({
    mutationFn: (habito: HabitoConEstado) =>
      alternarActivoHabito({
        data: { id: habito.id, activo: !habito.activo },
      }),
    onSuccess: (_resultado, habito) => {
      invalidar()
      toast.success(habito.activo ? "Hábito archivado" : "Hábito reactivado")
    },
    onError: () => toast.error("No se pudo cambiar el estado"),
  })

  const visibles = workspace.habitos.filter((habito) => {
    if (filtro === "archivados") return !habito.activo
    if (filtro === "bueno") return habito.activo && habito.tipo === "bueno"
    if (filtro === "malo") return habito.activo && habito.tipo === "malo"
    return habito.activo
  })

  const detalle =
    workspace.habitos.find((habito) => habito.id === detalleId) ?? null

  function abrirNuevo() {
    setHabitoEditando(null)
    setDialogoOpen(true)
  }

  function abrirEdicion(habito: Habito) {
    setDetalleId(null)
    setHabitoEditando(habito)
    setDialogoOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Rutina"
        title="Hábitos"
        description="Seguimiento diario, rachas, constancia y actividad de GitHub."
        meta={`${workspace.resumen.activos} ${
          workspace.resumen.activos === 1 ? "activo" : "activos"
        }`}
        actions={
          <Button onClick={abrirNuevo}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo hábito
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica
          icon={Activity}
          label="Hábitos activos"
          value={String(workspace.resumen.activos)}
          detalle={`${workspace.resumen.buenos} buenos · ${workspace.resumen.malos} a erradicar`}
        />
        <Metrica
          icon={Check}
          label="Completados hoy"
          value={`${workspace.resumen.completadosHoy}/${workspace.resumen.activos}`}
          detalle="Check-in diario"
        />
        <Metrica
          icon={Flame}
          label="Mejor racha"
          value={`${workspace.resumen.mejorRacha} d`}
          detalle="Días consecutivos"
        />
        <Metrica
          icon={GitBranch}
          label="Commits GitHub"
          value={String(workspace.resumen.commitsGithub)}
          detalle={`${workspace.resumen.diasConActividad} días con actividad`}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-full border border-outline-variant/60 bg-card p-1">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setFiltro(opcion.valor)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors",
                filtro === opcion.valor
                  ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                  : "text-muted-foreground hover:text-heading",
              )}
            >
              {opcion.etiqueta}
              {opcion.valor === "archivados" &&
              workspace.resumen.archivados > 0
                ? ` · ${workspace.resumen.archivados}`
                : ""}
            </button>
          ))}
        </div>
      </div>

      {workspace.habitos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
            <Activity className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-heading">
              Todavía no tenés hábitos
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Creá el primero y empezá a construir tu racha.
            </p>
          </div>
          <Button onClick={abrirNuevo}>
            <Plus className="size-4" aria-hidden="true" />
            Crear hábito
          </Button>
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/70 bg-card/40 px-5 py-12 text-center">
          <p className="text-xs font-bold text-heading">
            No hay hábitos en este filtro
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Probá con otro tipo o creá uno nuevo.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibles.map((habito) => (
            <TarjetaHabito
              key={habito.id}
              habito={habito}
              pendiente={registrar.isPending}
              onToggle={() => registrar.mutate(habito)}
              onAbrir={() => setDetalleId(habito.id)}
              onEditar={() => abrirEdicion(habito)}
              onArchivar={() => archivar.mutate(habito)}
            />
          ))}
        </div>
      )}

      <GithubActividad dias={workspace.github} hoy={workspace.hoy} />

      {dialogoOpen ? (
        <DialogoHabito
          key={habitoEditando?.id ?? "nuevo"}
          open
          onOpenChange={(open) => {
            if (!open) {
              setDialogoOpen(false)
              setHabitoEditando(null)
            }
          }}
          habito={habitoEditando}
        />
      ) : null}

      {detalle ? (
        <DetalleHabito
          habito={detalle}
          hoy={workspace.hoy}
          open
          onOpenChange={(open) => {
            if (!open) setDetalleId(null)
          }}
          onEditar={() => abrirEdicion(detalle)}
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
  icon: typeof Activity
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
