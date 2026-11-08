"use client"

import { useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { GitBranch, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { GITHUB_USUARIO } from "@/features/habitos/constantes"
import { sincronizarGithub } from "@/features/habitos/server/functions"
import type { GithubActividad } from "@/server/db/schema"
import { sumarFecha } from "@/lib/dates"
import { formatearFecha } from "@/lib/format"
import { cn } from "cn"

export function GithubActividad({
  dias,
  hoy,
}: {
  dias: GithubActividad[]
  hoy: string
}) {
  const queryClient = useQueryClient()

  const sincronizar = useMutation({
    mutationFn: () => sincronizarGithub(),
    onSuccess: (resultado) => {
      void queryClient.invalidateQueries({ queryKey: ["habitos"] })
      toast.success(
        `GitHub actualizado · ${resultado.dias} días, ${resultado.totalCommits} commits`,
      )
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo sincronizar GitHub",
      ),
  })

  const desde = sumarFecha(hoy, "dia", -29)
  const recientes = useMemo(
    () => dias.filter((dia) => dia.fecha >= desde),
    [dias, desde],
  )
  const mapa = useMemo(
    () => new Map(recientes.map((dia) => [dia.fecha, dia.commits])),
    [recientes],
  )
  const ultimos30 = useMemo(
    () =>
      Array.from({ length: 30 }, (_, indice) =>
        sumarFecha(hoy, "dia", indice - 29),
      ).map((fecha) => ({ fecha, commits: mapa.get(fecha) ?? 0 })),
    [hoy, mapa],
  )
  const maximo = Math.max(1, ...ultimos30.map((dia) => dia.commits))
  const totalCommits = recientes.reduce((total, dia) => total + dia.commits, 0)
  const diasActivos = recientes.filter(
    (dia) => dia.commits > 0 || dia.pullRequests > 0 || dia.issues > 0,
  ).length
  const ultimaActualizacion = dias
    .map((dia) => dia.actualizadoEn)
    .filter((valor): valor is string => Boolean(valor))
    .sort()
    .at(-1)

  return (
    <section className="rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-surface-container text-heading">
            <GitBranch className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-black text-heading">GitHub</h2>
            <p className="text-[10px] text-muted-foreground">
              @{GITHUB_USUARIO} · últimos 30 días
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full px-3 text-[10px] font-bold"
          disabled={sincronizar.isPending}
          onClick={() => sincronizar.mutate()}
        >
          {sincronizar.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-3.5" aria-hidden="true" />
          )}
          Actualizar
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-container-low p-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Commits
          </p>
          <p className="tabular mt-1 text-2xl font-black text-heading">
            {totalCommits}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container-low p-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Días con actividad
          </p>
          <p className="tabular mt-1 text-2xl font-black text-heading">
            {diasActivos}
          </p>
        </div>
      </div>

      <div className="mt-4 flex h-16 items-end gap-0.5">
        {ultimos30.map((dia) => (
          <div
            key={dia.fecha}
            className={cn(
              "flex-1 rounded-sm",
              dia.commits > 0 ? "bg-[#0b4c72]" : "bg-surface-container",
            )}
            style={{
              height: `${Math.max(8, (dia.commits / maximo) * 100)}%`,
            }}
            title={`${formatearFecha(dia.fecha, false)}: ${dia.commits} commits`}
          />
        ))}
      </div>

      <p className="mt-2 text-right text-[9px] text-muted-foreground">
        {ultimaActualizacion
          ? `Actualizado ${new Date(ultimaActualizacion).toLocaleString("es-AR", {
              dateStyle: "short",
              timeStyle: "short",
            })}`
          : "Sin sincronizaciones todavía"}
      </p>
    </section>
  )
}
