"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Clock3,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trophy,
  TrendingUp,
  Tv,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimesEstadoChart } from "@/features/animes/components/animes-estado-chart"
import { AnimesGenerosChart } from "@/features/animes/components/animes-generos-chart"
import { CalendarioAnimes } from "@/features/animes/components/calendario-animes"
import { DialogoAnime } from "@/features/animes/components/dialogo-anime"
import { PanelAnime } from "@/features/animes/components/panel-anime"
import { TarjetaAnime } from "@/features/animes/components/tarjeta-anime"
import {
  ANIMES_POR_PAGINA,
  etiquetasEstadoAnime,
  opcionesOrdenAnimes,
  type EstadoAnime,
  type OrdenAnimes,
} from "@/features/animes/constantes"
import { puntajeMostrable } from "@/features/animes/lib/criterios"
import {
  alternarFavoritoAnime,
  borrarAnime,
} from "@/features/animes/server/functions"
import type { AnimesWorkspace, VistaAnimes } from "@/features/animes/types"
import { formatNota } from "@/lib/format"
import { cn } from "cn"

export function WorkspaceAnimes({
  workspace,
  vista,
  onCambiarVista,
}: {
  workspace: AnimesWorkspace
  vista: VistaAnimes
  onCambiarVista: (vista: VistaAnimes) => void
}) {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = useState("")
  const [estado, setEstado] = useState<"todos" | EstadoAnime>("todos")
  const [genero, setGenero] = useState("todos")
  const [orden, setOrden] = useState<OrdenAnimes>("puntaje_desc")
  const [soloFavoritos, setSoloFavoritos] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [agregarOpen, setAgregarOpen] = useState(false)
  const [animeAbiertoId, setAnimeAbiertoId] = useState<number | null>(null)
  const [animeEditandoId, setAnimeEditandoId] = useState<number | null>(null)
  const [animeAEliminarId, setAnimeAEliminarId] = useState<number | null>(null)

  const animeAbierto =
    workspace.animes.find((anime) => anime.id === animeAbiertoId) ?? null
  const animeEditando =
    workspace.animes.find((anime) => anime.id === animeEditandoId) ?? null
  const animeAEliminar =
    workspace.animes.find((anime) => anime.id === animeAEliminarId) ?? null

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["animes"] })
  }

  const favorito = useMutation({
    mutationFn: (id: number) => alternarFavoritoAnime({ data: { id } }),
    onSuccess: (resultado) => {
      invalidar()
      toast.success(
        resultado.favorito ? "Agregado a favoritos" : "Quitado de favoritos",
      )
    },
    onError: () => toast.error("No se pudo actualizar favoritos"),
  })

  const eliminar = useMutation({
    mutationFn: (id: number) => borrarAnime({ data: { id } }),
    onSuccess: () => {
      invalidar()
      toast.success("Anime eliminado")
      setAnimeAEliminarId(null)
      setAnimeAbiertoId(null)
    },
    onError: () => toast.error("No se pudo eliminar el anime"),
  })

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const lista = workspace.animes.filter((anime) => {
      if (estado !== "todos" && anime.estado !== estado) return false
      if (genero !== "todos" && !(anime.generos ?? []).includes(genero)) {
        return false
      }
      if (soloFavoritos && !anime.favorito) return false
      if (texto.length === 0) return true

      const campos = [
        anime.titulo,
        anime.tituloIngles,
        anime.descripcion,
        anime.estudio,
        anime.fuente,
        anime.formato,
        anime.notas,
        ...(anime.generos ?? []),
        ...(anime.tags ?? []),
      ]
      return campos.some((campo) => campo?.toLowerCase().includes(texto))
    })

    return lista.sort((a, b) => {
      switch (orden) {
        case "titulo_asc":
          return a.titulo.localeCompare(b.titulo)
        case "agregado_desc":
          return b.agregadoEn.localeCompare(a.agregadoEn)
        case "fecha_desc":
          if (!a.fechaEmision) return 1
          if (!b.fechaEmision) return -1
          return b.fechaEmision.localeCompare(a.fechaEmision)
        case "progreso_desc": {
          const avanceA = a.episodios ? a.episodiosVistos / a.episodios : 0
          const avanceB = b.episodios ? b.episodiosVistos / b.episodios : 0
          return avanceB - avanceA
        }
        case "score_desc":
          return (b.scoreMal ?? -1) - (a.scoreMal ?? -1)
        case "puntaje_desc":
        default:
          return (puntajeMostrable(b) ?? -1) - (puntajeMostrable(a) ?? -1)
      }
    })
  }, [workspace.animes, busqueda, estado, genero, soloFavoritos, orden])

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / ANIMES_POR_PAGINA),
  )
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice(
    (paginaActual - 1) * ANIMES_POR_PAGINA,
    paginaActual * ANIMES_POR_PAGINA,
  )

  function cambiarFiltro(accion: () => void) {
    accion()
    setPagina(1)
  }

  function limpiarFiltros() {
    setBusqueda("")
    setEstado("todos")
    setGenero("todos")
    setOrden("puntaje_desc")
    setSoloFavoritos(false)
    setPagina(1)
  }

  const hayFiltros =
    busqueda.trim().length > 0 ||
    estado !== "todos" ||
    genero !== "todos" ||
    soloFavoritos ||
    orden !== "puntaje_desc"

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Entretenimiento"
        title="Animes"
        description="Tu biblioteca, tus puntajes y los estrenos de la semana."
        meta={`${workspace.resumen.total} en biblioteca`}
        actions={
          <Button onClick={() => setAgregarOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar anime
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica
          icon={Tv}
          label="En curso"
          value={String(workspace.resumen.viendo)}
          detalle={`${workspace.resumen.completados} completados`}
        />
        <Metrica
          icon={Clock3}
          label="Episodios vistos"
          value={workspace.resumen.episodiosVistos.toLocaleString("es-AR")}
          detalle={`${workspace.resumen.horasEstimadas} h estimadas`}
        />
        <Metrica
          icon={Trophy}
          label="Promedio"
          value={
            workspace.resumen.promedio !== null
              ? formatNota(workspace.resumen.promedio)
              : "—"
          }
          detalle="Sobre 100 puntos"
        />
        <Metrica
          icon={Star}
          label="Favoritos"
          value={String(workspace.resumen.favoritos)}
          detalle={`${workspace.resumen.total} animes en total`}
        />
      </section>

      <div className="flex w-fit flex-wrap items-center gap-1 rounded-full border border-outline-variant/60 bg-card p-1">
        {(
          [
            ["biblioteca", "Biblioteca"],
            ["estadisticas", "Estadísticas"],
            ["calendario", "Calendario"],
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

      {vista === "biblioteca" ? (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-outline-variant/60 bg-card p-3 shadow-elevation-1">
              <div className="relative min-w-48 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={busqueda}
                  onChange={(event) =>
                    cambiarFiltro(() => setBusqueda(event.target.value))
                  }
                  placeholder="Buscar por título, género o estudio..."
                  className="h-9 pl-8 text-xs"
                  aria-label="Buscar anime"
                />
              </div>

              <select
                value={estado}
                onChange={(event) =>
                  cambiarFiltro(() =>
                    setEstado(event.target.value as "todos" | EstadoAnime),
                  )
                }
                className="h-9 rounded-xl border border-outline-variant/70 bg-card px-2 text-[10px] font-semibold text-heading outline-none focus:border-ring"
                aria-label="Filtrar por estado"
              >
                <option value="todos">Todos los estados</option>
                {Object.entries(etiquetasEstadoAnime).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>

              <select
                value={genero}
                onChange={(event) =>
                  cambiarFiltro(() => setGenero(event.target.value))
                }
                className="h-9 max-w-40 rounded-xl border border-outline-variant/70 bg-card px-2 text-[10px] font-semibold text-heading outline-none focus:border-ring"
                aria-label="Filtrar por género"
              >
                <option value="todos">Todos los géneros</option>
                {workspace.metadatos.generos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={orden}
                onChange={(event) =>
                  cambiarFiltro(() => setOrden(event.target.value as OrdenAnimes))
                }
                className="h-9 rounded-xl border border-outline-variant/70 bg-card px-2 text-[10px] font-semibold text-heading outline-none focus:border-ring"
                aria-label="Ordenar animes"
              >
                {opcionesOrdenAnimes.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant={soloFavoritos ? "default" : "outline"}
                size="sm"
                className="h-9 rounded-full px-3 text-[10px] font-bold"
                onClick={() =>
                  cambiarFiltro(() => setSoloFavoritos((valor) => !valor))
                }
              >
                <Star
                  className={cn("size-3.5", soloFavoritos && "fill-current")}
                  aria-hidden="true"
                />
                Favoritos
              </Button>

              {hayFiltros ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-full px-3 text-[10px] font-bold"
                  onClick={limpiarFiltros}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Limpiar
                </Button>
              ) : null}
            </div>

            <p className="px-1 text-[10px] font-semibold text-muted-foreground">
              {filtrados.length} de {workspace.resumen.total} animes
              {filtrados.length > 0
                ? ` · página ${paginaActual} de ${totalPaginas}`
                : ""}
            </p>
          </section>

          {workspace.animes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
                <Tv className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black text-heading">
                  Tu biblioteca está vacía
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buscá un anime en Kitsu y empezá a registrar tu progreso.
                </p>
              </div>
              <Button onClick={() => setAgregarOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Agregar el primero
              </Button>
            </div>
          ) : visibles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-outline-variant/70 bg-card/40 px-5 py-12 text-center">
              <p className="text-xs font-bold text-heading">
                No hay animes con esos filtros
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Probá con otro estado, género o limpiá la búsqueda.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-8 rounded-full px-3 text-[10px] font-bold"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibles.map((anime) => (
                  <TarjetaAnime
                    key={anime.id}
                    anime={anime}
                    favoritoPendiente={
                      favorito.isPending && favorito.variables === anime.id
                    }
                    onAbrir={() => setAnimeAbiertoId(anime.id)}
                    onEditar={() => setAnimeEditandoId(anime.id)}
                    onAlternarFavorito={() => favorito.mutate(anime.id)}
                  />
                ))}
              </div>

              {totalPaginas > 1 ? (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3 text-[10px] font-bold"
                    disabled={paginaActual <= 1}
                    onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="tabular text-[10px] font-bold text-muted-foreground">
                    {paginaActual} / {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3 text-[10px] font-bold"
                    disabled={paginaActual >= totalPaginas}
                    onClick={() =>
                      setPagina((valor) => Math.min(totalPaginas, valor + 1))
                    }
                  >
                    Siguiente
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {vista === "estadisticas" ? (
        <div className="flex flex-col gap-4">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metrica
              icon={TrendingUp}
              label="Promedio"
              value={
                workspace.resumen.promedio !== null
                  ? formatNota(workspace.resumen.promedio)
                  : "—"
              }
              detalle="Puntaje propio"
            />
            <Metrica
              icon={Trophy}
              label="Mejor género"
              value={workspace.resumen.mejorGenero?.genero ?? "—"}
              detalle={
                workspace.resumen.mejorGenero
                  ? `${workspace.resumen.mejorGenero.promedio} pts · ${workspace.resumen.mejorGenero.total} animes`
                  : "Sin datos suficientes"
              }
            />
            <Metrica
              icon={Clock3}
              label="Horas estimadas"
              value={String(workspace.resumen.horasEstimadas)}
              detalle={`${workspace.resumen.episodiosVistos} episodios`}
            />
            <Metrica
              icon={Star}
              label="Favoritos"
              value={String(workspace.resumen.favoritos)}
              detalle={`${workspace.resumen.total} animes`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <AnimesEstadoChart datos={workspace.estadisticas.porEstado} />
            <AnimesGenerosChart datos={workspace.estadisticas.porGenero} />
          </section>

          <section className="rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-heading">
                  Top de tu biblioteca
                </h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Los 10 animes con mejor puntaje propio
                </p>
              </div>
              <Trophy className="size-4 text-secondary" aria-hidden="true" />
            </div>

            {workspace.estadisticas.top.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-surface-container-low px-3 py-6 text-center text-[11px] text-muted-foreground">
                Todavía no puntuaste ningún anime.
              </p>
            ) : (
              <ol className="mt-4 divide-y divide-outline-variant/30">
                {workspace.estadisticas.top.map((anime, indice) => (
                  <li
                    key={anime.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="tabular w-5 shrink-0 text-[10px] font-black text-muted-foreground">
                      {indice + 1}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-heading">
                      {anime.titulo}
                    </p>
                    <span className="tabular text-[10px] font-bold text-muted-foreground">
                      {anime.miPuntaje ?? "—"}
                    </span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-lime-voltage"
                        style={{
                          width: `${Math.min(100, Math.max(2, anime.miPuntaje ?? 0))}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : null}

      {vista === "calendario" ? (
        <CalendarioAnimes animes={workspace.animes} />
      ) : null}

      {agregarOpen ? (
        <DialogoAnime
          open
          onOpenChange={setAgregarOpen}
          onCreado={(id) => setAnimeAbiertoId(id)}
        />
      ) : null}

      {animeEditando ? (
        <DialogoAnime
          key={animeEditando.id}
          open
          onOpenChange={(open) => {
            if (!open) setAnimeEditandoId(null)
          }}
          anime={animeEditando}
        />
      ) : null}

      {animeAbierto ? (
        <PanelAnime
          anime={animeAbierto}
          open={animeAbiertoId !== null}
          onOpenChange={(open) => {
            if (!open) setAnimeAbiertoId(null)
          }}
          onEditar={() => {
            setAnimeEditandoId(animeAbierto.id)
            setAnimeAbiertoId(null)
          }}
          onEliminar={() => setAnimeAEliminarId(animeAbierto.id)}
        />
      ) : null}

      <AlertDialog
        open={animeAEliminarId !== null}
        onOpenChange={(open) => {
          if (!open) setAnimeAEliminarId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este anime?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar “{animeAEliminar?.titulo}” de tu biblioteca junto
              con su progreso y puntajes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => {
                if (animeAEliminarId !== null) eliminar.mutate(animeAEliminarId)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Metrica({
  icon: Icon,
  label,
  value,
  detalle,
}: {
  icon: typeof Tv
  label: string
  value: string
  detalle: string
}) {
  return (
    <div className="rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-secondary" aria-hidden="true" />
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="tabular mt-3 truncate text-2xl font-black leading-none text-heading">
        {value}
      </p>
      <p className="mt-2 truncate text-[9px] text-muted-foreground">{detalle}</p>
    </div>
  )
}
