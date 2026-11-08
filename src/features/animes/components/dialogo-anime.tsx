"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Search,
  Star,
  Tv,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { kitsuBusquedaQuery } from "@/features/animes/api"
import {
  CRITERIOS_ANIME,
  PUNTAJE_MAXIMO_TOTAL,
  extraerPuntajes,
  type CriterioAnimeKey,
} from "@/features/animes/lib/criterios"
import {
  actualizarAnime,
  crearAnime,
  getDetalleKitsu,
} from "@/features/animes/server/functions"
import {
  estadosAnime,
  etiquetasEstadoAnime,
  type EstadoAnime,
} from "@/features/animes/constantes"
import type { KitsuAnime } from "@/features/animes/types"
import type {
  ActualizarAnimeInput,
  CrearAnimeInput,
} from "@/features/animes/schemas"
import type { AnimeVisto } from "@/server/db/schema"
import { cn } from "cn"

type FormAnime = {
  kitsuId: number | null
  titulo: string
  tituloIngles: string
  imagen: string
  tipo: string
  episodios: string
  ano: string
  fechaEmision: string
  generos: string
  descripcion: string
  scoreMal: string
  estado: EstadoAnime
  notas: string
  episodiosVistos: string
  favorito: boolean
  anilistId: string
  estudio: string
  fuente: string
  formato: string
  tags: string
}

type PuntajesForm = Record<CriterioAnimeKey, string>

const formVacio: FormAnime = {
  kitsuId: null,
  titulo: "",
  tituloIngles: "",
  imagen: "",
  tipo: "",
  episodios: "",
  ano: "",
  fechaEmision: "",
  generos: "",
  descripcion: "",
  scoreMal: "",
  estado: "completado",
  notas: "",
  episodiosVistos: "0",
  favorito: false,
  anilistId: "",
  estudio: "",
  fuente: "",
  formato: "",
  tags: "",
}

const puntajesVacios = Object.fromEntries(
  CRITERIOS_ANIME.map((criterio) => [criterio.key, ""]),
) as PuntajesForm

function formDesdeAnime(anime: AnimeVisto): FormAnime {
  return {
    kitsuId: anime.kitsuId,
    titulo: anime.titulo,
    tituloIngles: anime.tituloIngles ?? "",
    imagen: anime.imagen,
    tipo: anime.tipo ?? "",
    episodios: anime.episodios !== null ? String(anime.episodios) : "",
    ano: anime.ano !== null ? String(anime.ano) : "",
    fechaEmision: anime.fechaEmision ?? "",
    generos: (anime.generos ?? []).join(", "),
    descripcion: anime.descripcion ?? "",
    scoreMal: anime.scoreMal !== null ? String(anime.scoreMal) : "",
    estado: anime.estado,
    notas: anime.notas ?? "",
    episodiosVistos: String(anime.episodiosVistos),
    favorito: anime.favorito,
    anilistId: anime.anilistId !== null ? String(anime.anilistId) : "",
    estudio: anime.estudio ?? "",
    fuente: anime.fuente ?? "",
    formato: anime.formato ?? "",
    tags: (anime.tags ?? []).join(", "),
  }
}

function formDesdeKitsu(kitsu: KitsuAnime): FormAnime {
  return {
    ...formVacio,
    kitsuId: kitsu.kitsuId,
    titulo: kitsu.titulo,
    tituloIngles: kitsu.tituloIngles ?? "",
    imagen: kitsu.imagen,
    tipo: kitsu.tipo ?? "",
    episodios: kitsu.episodios !== null ? String(kitsu.episodios) : "",
    ano: kitsu.ano !== null ? String(kitsu.ano) : "",
    fechaEmision: kitsu.fechaEmision ?? "",
    generos: kitsu.generos.join(", "),
    descripcion: kitsu.descripcion ?? "",
    scoreMal: kitsu.scoreMal !== null ? String(kitsu.scoreMal) : "",
    estudio: kitsu.estudio ?? "",
  }
}

function puntajesDesdeAnime(anime: AnimeVisto): PuntajesForm {
  const extraidos = extraerPuntajes(anime)
  return Object.fromEntries(
    CRITERIOS_ANIME.map((criterio) => [
      criterio.key,
      extraidos[criterio.key] !== null ? String(extraidos[criterio.key]) : "",
    ]),
  ) as PuntajesForm
}

function numeroONull(valor: string): number | null {
  const texto = valor.trim()
  if (!texto) return null
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : null
}

function puntajeONull(valor: string): number | null {
  const numero = numeroONull(valor)
  if (numero === null) return null
  return Math.max(0, Math.min(10, Math.round(numero)))
}

function listaDesdeTexto(texto: string): string[] {
  return Array.from(
    new Set(
      texto
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

export function DialogoAnime({
  open,
  onOpenChange,
  anime,
  onCreado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  anime?: AnimeVisto | null
  onCreado?: (id: number) => void
}) {
  const queryClient = useQueryClient()
  const [paso, setPaso] = useState<"buscar" | "formulario">("buscar")
  const [textoBusqueda, setTextoBusqueda] = useState("")
  const [textoDebounced, setTextoDebounced] = useState("")
  const [seleccionandoId, setSeleccionandoId] = useState<number | null>(null)
  const [form, setForm] = useState<FormAnime>(formVacio)
  const [puntajes, setPuntajes] = useState<PuntajesForm>(puntajesVacios)

  const editando = Boolean(anime)

  useEffect(() => {
    if (!open) return
    if (anime) {
      setForm(formDesdeAnime(anime))
      setPuntajes(puntajesDesdeAnime(anime))
      setPaso("formulario")
      return
    }
    setForm(formVacio)
    setPuntajes(puntajesVacios)
    setPaso("buscar")
    setTextoBusqueda("")
    setTextoDebounced("")
  }, [open, anime?.id])

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setTextoDebounced(textoBusqueda.trim())
    }, 350)
    return () => window.clearTimeout(temporizador)
  }, [textoBusqueda])

  const busqueda = useQuery(kitsuBusquedaQuery(textoDebounced))

  const seleccionar = useMutation({
    mutationFn: async (kitsu: KitsuAnime) => {
      const detalle = await getDetalleKitsu({
        data: { id: kitsu.kitsuId },
      })
      return detalle ?? kitsu
    },
    onSuccess: (kitsu) => {
      setForm(formDesdeKitsu(kitsu))
      setPuntajes(puntajesVacios)
      setPaso("formulario")
    },
    onError: () => toast.error("No se pudo cargar el anime desde Kitsu"),
    onSettled: () => setSeleccionandoId(null),
  })

  const crear = useMutation({
    mutationFn: (datos: CrearAnimeInput) => crearAnime({ data: datos }),
    onSuccess: (resultado) => {
      void queryClient.invalidateQueries({ queryKey: ["animes"] })
      toast.success("Anime agregado a tu biblioteca")
      onOpenChange(false)
      if (resultado.id) onCreado?.(resultado.id)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo agregar el anime",
      ),
  })

  const editar = useMutation({
    mutationFn: (datos: ActualizarAnimeInput) =>
      actualizarAnime({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["animes"] })
      toast.success("Anime actualizado")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el anime",
      ),
  })

  const guardando = crear.isPending || editar.isPending

  const totalPuntaje = useMemo(
    () =>
      CRITERIOS_ANIME.reduce((total, criterio) => {
        const valor = puntajeONull(puntajes[criterio.key])
        return total + (valor ?? 0)
      }, 0),
    [puntajes],
  )

  const criteriosCalificados = useMemo(
    () =>
      CRITERIOS_ANIME.filter(
        (criterio) => puntajeONull(puntajes[criterio.key]) !== null,
      ).length,
    [puntajes],
  )

  const teniaDesglose = useMemo(
    () =>
      anime
        ? CRITERIOS_ANIME.some((criterio) => anime[criterio.campo] !== null)
        : false,
    [anime],
  )

  function actualizar<TCampo extends keyof FormAnime>(
    campo: TCampo,
    valor: FormAnime[TCampo],
  ) {
    setForm((anterior) => ({ ...anterior, [campo]: valor }))
  }

  function enviar() {
    if (!form.titulo.trim() || !form.imagen.trim()) {
      toast.error("Completá el título y la imagen")
      return
    }

    const incluirPuntajes = criteriosCalificados > 0 || teniaDesglose
    const puntajesData = incluirPuntajes
      ? {
          puntajes: Object.fromEntries(
            CRITERIOS_ANIME.map((criterio) => [
              criterio.key,
              puntajeONull(puntajes[criterio.key]),
            ]),
          ),
        }
      : {}

    const base = {
      titulo: form.titulo.trim(),
      tituloIngles: form.tituloIngles.trim() || null,
      imagen: form.imagen.trim(),
      tipo: form.tipo.trim() || null,
      episodios: numeroONull(form.episodios),
      ano: numeroONull(form.ano),
      fechaEmision: form.fechaEmision || null,
      generos: listaDesdeTexto(form.generos),
      descripcion: form.descripcion.trim() || null,
      scoreMal: numeroONull(form.scoreMal),
      estado: form.estado,
      notas: form.notas.trim() || null,
      episodiosVistos: Math.max(0, numeroONull(form.episodiosVistos) ?? 0),
      favorito: form.favorito,
      anilistId: numeroONull(form.anilistId),
      estudio: form.estudio.trim() || null,
      fuente: form.fuente.trim() || null,
      formato: form.formato.trim() || null,
      tags: listaDesdeTexto(form.tags),
      ...puntajesData,
    }

    if (anime) {
      editar.mutate({ id: anime.id, ...base })
      return
    }

    if (!form.kitsuId) {
      toast.error("Elegí un anime desde Kitsu")
      return
    }

    crear.mutate({ kitsuId: form.kitsuId, ...base })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {editando
              ? "Editar anime"
              : paso === "buscar"
                ? "Agregar anime"
                : "Completar datos"}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? "Actualizá los datos, el progreso y tus puntajes."
              : paso === "buscar"
                ? "Buscá en Kitsu y elegí el anime que querés sumar."
                : "Revisá la información y ajustá tu progreso."}
          </DialogDescription>
        </DialogHeader>

        {paso === "buscar" && !editando ? (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                autoFocus
                value={textoBusqueda}
                onChange={(event) => setTextoBusqueda(event.target.value)}
                placeholder="Buscá por título: Frieren, One Piece, ..."
                className="h-11 pl-9"
              />
            </div>

            {textoDebounced.length < 2 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline-variant/70 px-5 py-10 text-center">
                <Tv className="size-6 text-muted-foreground" aria-hidden="true" />
                <p className="text-xs font-bold text-heading">
                  Buscá un anime para empezar
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Los datos se completan desde Kitsu y después podés editarlos.
                </p>
              </div>
            ) : null}

            {busqueda.isFetching ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs font-semibold text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Buscando en Kitsu...
              </div>
            ) : null}

            {!busqueda.isFetching &&
            textoDebounced.length >= 2 &&
            (busqueda.data?.length ?? 0) === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/70 px-5 py-10 text-center">
                <p className="text-xs font-bold text-heading">
                  No encontramos resultados
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Probá con otro título o revisá cómo está escrito.
                </p>
              </div>
            ) : null}

            {busqueda.data && busqueda.data.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {busqueda.data.map((kitsu) => {
                  const cargando = seleccionandoId === kitsu.kitsuId
                  return (
                    <button
                      key={kitsu.kitsuId}
                      type="button"
                      disabled={seleccionar.isPending}
                      onClick={() => {
                        setSeleccionandoId(kitsu.kitsuId)
                        seleccionar.mutate(kitsu)
                      }}
                      className="flex items-start gap-3 rounded-2xl border border-outline-variant/60 bg-card p-2 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
                    >
                      {kitsu.imagen ? (
                        <img
                          src={kitsu.imagen}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-20 w-14 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="flex h-20 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-container text-muted-foreground">
                          <Tv className="size-5" aria-hidden="true" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[11px] font-bold text-heading">
                          {kitsu.tituloIngles || kitsu.titulo}
                        </span>
                        <span className="mt-1 block text-[9px] text-muted-foreground">
                          {[
                            kitsu.ano,
                            kitsu.tipo,
                            kitsu.episodios ? `${kitsu.episodios} eps` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {kitsu.generos.slice(0, 2).map((genero) => (
                            <span
                              key={genero}
                              className="rounded-full bg-surface-container px-1.5 py-0.5 text-[8px] font-semibold text-muted-foreground"
                            >
                              {genero}
                            </span>
                          ))}
                        </span>
                        <span className="mt-2 flex items-center gap-1 text-[9px] font-bold text-heading">
                          {cargando ? (
                            <>
                              <Loader2
                                className="size-3 animate-spin"
                                aria-hidden="true"
                              />
                              Cargando...
                            </>
                          ) : (
                            <>
                              <Plus className="size-3" aria-hidden="true" />
                              Agregar
                            </>
                          )}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              enviar()
            }}
          >
            {!editando ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 rounded-full px-2 text-[10px] font-bold"
                onClick={() => setPaso("buscar")}
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Volver a buscar
              </Button>
            ) : null}

            <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-3">
              {form.imagen ? (
                <img
                  src={form.imagen}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-20 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-black text-heading">
                  {form.titulo || "Sin título"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {[
                    form.ano,
                    form.tipo,
                    form.episodios ? `${form.episodios} eps` : null,
                    form.kitsuId ? `Kitsu #${form.kitsuId}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Completá los datos"}
                </p>
                {form.fechaEmision ? (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Emisión: {form.fechaEmision}
                  </p>
                ) : null}
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Datos del anime
              </h3>

              <div className="space-y-2">
                <Label htmlFor="anime-titulo">Título</Label>
                <Input
                  id="anime-titulo"
                  value={form.titulo}
                  onChange={(event) => actualizar("titulo", event.target.value)}
                  placeholder="Título principal"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anime-titulo-ingles">Título en inglés</Label>
                  <Input
                    id="anime-titulo-ingles"
                    value={form.tituloIngles}
                    onChange={(event) =>
                      actualizar("tituloIngles", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anime-imagen">Imagen (URL)</Label>
                  <Input
                    id="anime-imagen"
                    value={form.imagen}
                    onChange={(event) => actualizar("imagen", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="anime-tipo">Tipo</Label>
                  <Input
                    id="anime-tipo"
                    value={form.tipo}
                    onChange={(event) => actualizar("tipo", event.target.value)}
                    placeholder="TV, Movie, OVA..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anime-episodios">Episodios</Label>
                  <Input
                    id="anime-episodios"
                    type="number"
                    min="0"
                    value={form.episodios}
                    onChange={(event) =>
                      actualizar("episodios", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anime-ano">Año</Label>
                  <Input
                    id="anime-ano"
                    type="number"
                    min="1900"
                    max="2200"
                    value={form.ano}
                    onChange={(event) => actualizar("ano", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anime-fecha">Fecha de emisión</Label>
                  <Input
                    id="anime-fecha"
                    type="date"
                    value={form.fechaEmision}
                    onChange={(event) =>
                      actualizar("fechaEmision", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anime-score">Score MAL (0-10)</Label>
                  <Input
                    id="anime-score"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={form.scoreMal}
                    onChange={(event) =>
                      actualizar("scoreMal", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anime-estudio">Estudio</Label>
                  <Input
                    id="anime-estudio"
                    value={form.estudio}
                    onChange={(event) =>
                      actualizar("estudio", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anime-fuente">Fuente</Label>
                  <Input
                    id="anime-fuente"
                    value={form.fuente}
                    onChange={(event) => actualizar("fuente", event.target.value)}
                    placeholder="Manga, Light Novel..."
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anime-formato">Formato</Label>
                  <Input
                    id="anime-formato"
                    value={form.formato}
                    onChange={(event) =>
                      actualizar("formato", event.target.value)
                    }
                    placeholder="Serie, película..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anime-generos">Géneros (separados por coma)</Label>
                  <Input
                    id="anime-generos"
                    value={form.generos}
                    onChange={(event) =>
                      actualizar("generos", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anime-descripcion">Descripción</Label>
                <Textarea
                  id="anime-descripcion"
                  value={form.descripcion}
                  onChange={(event) =>
                    actualizar("descripcion", event.target.value)
                  }
                  rows={3}
                />
              </div>
            </section>

            <section className="space-y-3 border-t border-outline-variant/40 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Tu biblioteca
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="anime-estado">Estado</Label>
                  <select
                    id="anime-estado"
                    value={form.estado}
                    onChange={(event) =>
                      actualizar("estado", event.target.value as EstadoAnime)
                    }
                    className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
                  >
                    {estadosAnime.map((estado) => (
                      <option key={estado} value={estado}>
                        {etiquetasEstadoAnime[estado]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anime-vistos">Episodios vistos</Label>
                  <Input
                    id="anime-vistos"
                    type="number"
                    min="0"
                    value={form.episodiosVistos}
                    onChange={(event) =>
                      actualizar("episodiosVistos", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anime-anilist">AniList ID</Label>
                  <Input
                    id="anime-anilist"
                    type="number"
                    min="1"
                    value={form.anilistId}
                    onChange={(event) =>
                      actualizar("anilistId", event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anime-tags">Tags (separados por coma)</Label>
                  <Input
                    id="anime-tags"
                    value={form.tags}
                    onChange={(event) => actualizar("tags", event.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant={form.favorito ? "default" : "outline"}
                    className="w-full"
                    onClick={() => actualizar("favorito", !form.favorito)}
                  >
                    <Star
                      className={cn("size-4", form.favorito && "fill-current")}
                      aria-hidden="true"
                    />
                    {form.favorito ? "Favorito" : "Marcar favorito"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anime-notas">Notas</Label>
                <Textarea
                  id="anime-notas"
                  value={form.notas}
                  onChange={(event) => actualizar("notas", event.target.value)}
                  rows={2}
                  placeholder="Qué te pareció, dónde lo viste, etc."
                />
              </div>
            </section>

            <details className="rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
              <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Puntajes por criterio · {criteriosCalificados}/10 ·{" "}
                {totalPuntaje}/{PUNTAJE_MAXIMO_TOTAL}
              </summary>

              {editando && !teniaDesglose && anime?.miPuntaje ? (
                <p className="mt-3 rounded-xl bg-warning-container px-3 py-2 text-[10px] font-semibold text-warning">
                  Este anime tiene un puntaje total guardado sin desglose. Si no
                  cargás criterios, se conserva.
                </p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {CRITERIOS_ANIME.map((criterio) => (
                  <div key={criterio.key} className="space-y-1">
                    <Label
                      htmlFor={`puntaje-${criterio.key}`}
                      title={criterio.descripcion}
                      className="text-[10px]"
                    >
                      {criterio.etiqueta}
                    </Label>
                    <Input
                      id={`puntaje-${criterio.key}`}
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      value={puntajes[criterio.key]}
                      onChange={(event) =>
                        setPuntajes((anterior) => ({
                          ...anterior,
                          [criterio.key]: event.target.value,
                        }))
                      }
                      placeholder="0-10"
                      className="h-9"
                    />
                  </div>
                ))}
              </div>
            </details>

            <DialogFooter showCloseButton={false}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={guardando || !form.titulo.trim() || !form.imagen.trim()}
              >
                {guardando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    {editando ? "Guardar cambios" : "Agregar anime"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {paso === "buscar" && !editando ? (
          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
