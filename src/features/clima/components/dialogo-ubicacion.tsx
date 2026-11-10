"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, MapPin, Plus, Search } from "lucide-react"
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
import {
  buscarUbicaciones,
  crearUbicacion,
} from "@/features/clima/server/functions"
import type { ResultadoGeocoding } from "@/features/clima/types"
import { cn } from "cn"

type ModoUbicacion = "buscar" | "coordenadas"

export function DialogoUbicacion({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [modo, setModo] = useState<ModoUbicacion>("buscar")
  const [query, setQuery] = useState("")
  const [resultados, setResultados] = useState<ResultadoGeocoding[]>([])
  const [seleccionada, setSeleccionada] =
    useState<ResultadoGeocoding | null>(null)
  const [etiqueta, setEtiqueta] = useState("")
  const [latitud, setLatitud] = useState("")
  const [longitud, setLongitud] = useState("")
  const [etiquetaCoordenadas, setEtiquetaCoordenadas] = useState("")

  useEffect(() => {
    if (!open) return
    setModo("buscar")
    setQuery("")
    setResultados([])
    setSeleccionada(null)
    setEtiqueta("")
    setLatitud("")
    setLongitud("")
    setEtiquetaCoordenadas("")
  }, [open])

  const latitudNumero = Number(latitud)
  const longitudNumero = Number(longitud)
  const coordenadasValidas =
    latitud.trim() !== "" &&
    longitud.trim() !== "" &&
    Number.isFinite(latitudNumero) &&
    Number.isFinite(longitudNumero) &&
    latitudNumero >= -90 &&
    latitudNumero <= 90 &&
    longitudNumero >= -180 &&
    longitudNumero <= 180

  const etiquetaSugerida = coordenadasValidas
    ? `${latitudNumero.toFixed(4)}, ${longitudNumero.toFixed(4)}`
    : "Latitud, longitud"

  const puedeGuardar =
    modo === "buscar" ? Boolean(seleccionada) : coordenadasValidas

  const buscar = useMutation({
    mutationFn: () => buscarUbicaciones({ data: { query } }),
    onSuccess: (data) => {
      setResultados(data)
      if (data.length === 0) toast.info("No encontramos esa ubicación")
    },
    onError: () => toast.error("No se pudo buscar la ubicación"),
  })

  const guardar = useMutation({
    mutationFn: () => {
      if (modo === "coordenadas") {
        if (!coordenadasValidas) {
          throw new Error("Ingresá coordenadas válidas")
        }
        return crearUbicacion({
          data: {
            etiqueta:
              etiquetaCoordenadas.trim() ||
              `${latitudNumero.toFixed(4)}, ${longitudNumero.toFixed(4)}`,
            latitud: latitudNumero,
            longitud: longitudNumero,
          },
        })
      }

      if (!seleccionada) throw new Error("Elegí una ubicación")
      return crearUbicacion({
        data: {
          etiqueta: etiqueta.trim() || seleccionada.nombre,
          latitud: seleccionada.latitud,
          longitud: seleccionada.longitud,
        },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clima"] })
      toast.success("Ubicación guardada")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar",
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Agregar ubicación
          </DialogTitle>
          <DialogDescription>
            Buscá una ciudad o guardá una ubicación por sus coordenadas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-fit items-center gap-1 rounded-full border border-outline-variant/60 bg-surface-container-low p-1">
          {(
            [
              ["buscar", "Buscar"],
              ["coordenadas", "Coordenadas"],
            ] as const
          ).map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setModo(valor)}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold transition-colors",
                modo === valor
                  ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                  : "text-muted-foreground hover:text-heading",
              )}
            >
              {texto}
            </button>
          ))}
        </div>

        {modo === "buscar" ? (
          <>
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (query.trim().length < 2) return
                buscar.mutate()
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Río Cuarto, Córdoba..."
                  className="pl-9"
                />
              </div>
              <Button
                type="submit"
                disabled={query.trim().length < 2 || buscar.isPending}
              >
                {buscar.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Buscar"
                )}
              </Button>
            </form>

            {resultados.length > 0 ? (
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                {resultados.map((resultado) => {
                  const activa = seleccionada?.id === resultado.id
                  return (
                    <button
                      key={resultado.id}
                      type="button"
                      onClick={() => {
                        setSeleccionada(resultado)
                        setEtiqueta(resultado.nombre)
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
                        activa
                          ? "border-lime-voltage bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage"
                          : "border-outline-variant/50 hover:bg-muted",
                      )}
                    >
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">
                          {resultado.nombre}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {[resultado.provincia, resultado.pais]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}

            {seleccionada ? (
              <div className="space-y-2">
                <Label htmlFor="ubicacion-etiqueta">Nombre para mostrar</Label>
                <Input
                  id="ubicacion-etiqueta"
                  value={etiqueta}
                  onChange={(event) => setEtiqueta(event.target.value)}
                  placeholder={seleccionada.nombre}
                />
                <p className="text-[10px] text-muted-foreground">
                  Coordenadas: {seleccionada.latitud.toFixed(4)},{" "}
                  {seleccionada.longitud.toFixed(4)}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ubicacion-latitud">Latitud</Label>
                <Input
                  id="ubicacion-latitud"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={-90}
                  max={90}
                  value={latitud}
                  onChange={(event) => setLatitud(event.target.value)}
                  placeholder="-33.1307"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ubicacion-longitud">Longitud</Label>
                <Input
                  id="ubicacion-longitud"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={-180}
                  max={180}
                  value={longitud}
                  onChange={(event) => setLongitud(event.target.value)}
                  placeholder="-64.3499"
                />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Latitud entre -90 y 90. Longitud entre -180 y 180.
            </p>

            <div className="space-y-2">
              <Label htmlFor="ubicacion-nombre-coordenadas">
                Nombre para mostrar (opcional)
              </Label>
              <Input
                id="ubicacion-nombre-coordenadas"
                value={etiquetaCoordenadas}
                onChange={(event) =>
                  setEtiquetaCoordenadas(event.target.value)
                }
                placeholder={etiquetaSugerida}
              />
            </div>

            {coordenadasValidas ? (
              <p className="flex items-center gap-1.5 rounded-2xl bg-surface-container-low px-3 py-2 text-[10px] font-semibold text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                Se guardará como{" "}
                <span className="truncate font-bold text-heading">
                  {etiquetaCoordenadas.trim() || etiquetaSugerida}
                </span>
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter showCloseButton={false}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!puedeGuardar || guardar.isPending}
            onClick={() => guardar.mutate()}
          >
            <Plus className="size-4" aria-hidden="true" />
            {guardar.isPending ? "Guardando..." : "Guardar ubicación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
