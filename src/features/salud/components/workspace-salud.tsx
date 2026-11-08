"use client"

import { useState } from "react"
import { HeartPulse, Plus } from "lucide-react"

import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { DialogoCierreEpisodio } from "@/features/salud/components/dialogo-cierre-episodio"
import { DialogoEpisodio } from "@/features/salud/components/dialogo-episodio"
import { VistaBienestar } from "@/features/salud/components/vista-bienestar"
import { VistaMigrana } from "@/features/salud/components/vista-migrana"
import type {
  EpisodioConFactores,
  VistaSalud,
  WorkspaceSalud,
} from "@/features/salud/types"
import { cn } from "cn"

export function WorkspaceSalud({
  workspace,
  vista,
  onCambiarVista,
}: {
  workspace: WorkspaceSalud
  vista: VistaSalud
  onCambiarVista: (vista: VistaSalud) => void
}) {
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [episodioEditando, setEpisodioEditando] =
    useState<EpisodioConFactores | null>(null)
  const [episodioCerrando, setEpisodioCerrando] =
    useState<EpisodioConFactores | null>(null)

  function abrirNuevo() {
    setEpisodioEditando(null)
    setDialogoAbierto(true)
  }

  function abrirEdicion(episodio: EpisodioConFactores) {
    setEpisodioEditando(episodio)
    setDialogoAbierto(true)
  }

  const meta =
    workspace.rachaLibre !== null
      ? `Racha de ${workspace.rachaLibre} ${
          workspace.rachaLibre === 1 ? "día" : "días"
        }`
      : `${workspace.totalEpisodios} episodios`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Bienestar"
        title="Salud"
        description="Registro de migraña, desencadenantes y hábitos diarios en un solo lugar."
        meta={meta}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onCambiarVista("bienestar")}
            >
              <HeartPulse className="size-4" aria-hidden="true" />
              Registrar día
            </Button>
            <Button onClick={abrirNuevo}>
              <Plus className="size-4" aria-hidden="true" />
              Registrar episodio
            </Button>
          </div>
        }
      />

      <div className="flex w-fit flex-wrap items-center gap-1 rounded-full border border-outline-variant/60 bg-card p-1">
        {(
          [
            ["migrana", "Migraña"],
            ["bienestar", "Bienestar"],
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

      {vista === "migrana" ? (
        <VistaMigrana
          data={workspace}
          onNuevoEpisodio={abrirNuevo}
          onEditar={abrirEdicion}
          onCerrar={setEpisodioCerrando}
        />
      ) : (
        <VistaBienestar data={workspace} />
      )}

      {dialogoAbierto ? (
        <DialogoEpisodio
          key={episodioEditando?.id ?? "nuevo"}
          open
          onOpenChange={(open) => {
            if (!open) {
              setDialogoAbierto(false)
              setEpisodioEditando(null)
            }
          }}
          episodio={episodioEditando}
          ahora={workspace.ahora}
        />
      ) : null}

      {episodioCerrando ? (
        <DialogoCierreEpisodio
          open
          onOpenChange={(open) => {
            if (!open) setEpisodioCerrando(null)
          }}
          episodio={episodioCerrando}
        />
      ) : null}
    </div>
  )
}
