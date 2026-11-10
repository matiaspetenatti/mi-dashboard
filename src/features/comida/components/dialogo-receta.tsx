"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChefHat, Loader2, Plus, Save, Trash2 } from "lucide-react"
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
import { NutricionEditor } from "@/features/comida/components/nutricion-editor"
import {
  nutricionDesdeForm,
  nutricionFormDesde,
  nutricionFormVacia,
  type CampoNutricion,
  type NutricionForm,
} from "@/features/comida/lib/nutricion"
import {
  TIPOS_RECETA,
  TONOS,
  UNIDADES,
  type UnidadComida,
} from "@/features/comida/constantes"
import {
  actualizarReceta,
  crearReceta,
} from "@/features/comida/server/functions"
import type {
  ActualizarRecetaInput,
  CrearRecetaInput,
} from "@/features/comida/schemas"
import type {
  RecetaComida,
  TonoReceta,
  TipoReceta,
} from "@/server/db/schema"
import { cn } from "cn"

const CAMPO =
  "h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"

type FilaIngrediente = {
  nombre: string
  cantidad: string
  unidad: UnidadComida
  opcional: boolean
  ingredienteId: number | null
  detalle: string | null
}

const FILA_VACIA: FilaIngrediente = {
  nombre: "",
  cantidad: "",
  unidad: "unidad",
  opcional: false,
  ingredienteId: null,
  detalle: null,
}

function filasDesde(receta: RecetaComida | null | undefined): FilaIngrediente[] {
  if (!receta || receta.ingredientes.length === 0) return [{ ...FILA_VACIA }]
  return receta.ingredientes.map((ingrediente) => ({
    nombre: ingrediente.nombre,
    cantidad:
      ingrediente.cantidad !== null ? String(ingrediente.cantidad) : "",
    unidad: ingrediente.unidad as UnidadComida,
    opcional: ingrediente.opcional,
    ingredienteId: ingrediente.ingredienteId,
    detalle: ingrediente.detalle,
  }))
}

export function DialogoReceta({
  open,
  onOpenChange,
  receta,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  receta?: RecetaComida | null
}) {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState<TipoReceta>("cena")
  const [tono, setTono] = useState<TonoReceta>("sencillo")
  const [minutos, setMinutos] = useState("30")
  const [porciones, setPorciones] = useState("2")
  const [filas, setFilas] = useState<FilaIngrediente[]>([{ ...FILA_VACIA }])
  const [pasos, setPasos] = useState("")
  const [tips, setTips] = useState("")
  const [herramientas, setHerramientas] = useState("")
  const [vaso, setVaso] = useState("")
  const [tecnica, setTecnica] = useState("")
  const [nutricionActiva, setNutricionActiva] = useState(false)
  const [nutricion, setNutricion] =
    useState<NutricionForm>(nutricionFormVacia)

  useEffect(() => {
    if (!open) return
    setTitulo(receta?.titulo ?? "")
    setTipo(receta?.tipo ?? "cena")
    setTono(receta?.tono ?? "sencillo")
    setMinutos(receta ? String(receta.minutos) : "30")
    setPorciones(receta ? String(receta.porciones) : "2")
    setFilas(filasDesde(receta))
    setPasos(receta?.pasos.join("\n") ?? "")
    setTips(receta?.tips ?? "")
    setHerramientas((receta?.herramientas ?? []).join(", "))
    setVaso(receta?.vaso ?? "")
    setTecnica(receta?.tecnica ?? "")
    setNutricionActiva(Boolean(receta?.nutricion))
    setNutricion(nutricionFormDesde(receta?.nutricion))
  }, [open, receta?.id])

  const crear = useMutation({
    mutationFn: (datos: CrearRecetaInput) => crearReceta({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comida"] })
      toast.success("Receta guardada")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar la receta",
      ),
  })

  const editar = useMutation({
    mutationFn: (datos: ActualizarRecetaInput) =>
      actualizarReceta({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comida"] })
      toast.success("Receta actualizada")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar la receta",
      ),
  })

  const guardando = crear.isPending || editar.isPending

  function numero(valor: string): number | null {
    const texto = valor.trim().replace(",", ".")
    if (!texto) return null
    const n = Number(texto)
    return Number.isFinite(n) ? n : null
  }

  function actualizarFila(
    indice: number,
    cambios: Partial<FilaIngrediente>,
  ) {
    setFilas((anterior) =>
      anterior.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    )
  }

  function enviar() {
    const ingredientes: CrearRecetaInput["ingredientes"] = filas
      .filter((fila) => fila.nombre.trim())
      .map((fila) => ({
        nombre: fila.nombre.trim(),
        cantidad: numero(fila.cantidad),
        unidad: fila.unidad,
        detalle: fila.detalle,
        opcional: fila.opcional,
        ingredienteId: fila.ingredienteId,
      }))

    const pasosLista = pasos
      .split("\n")
      .map((paso) => paso.trim())
      .filter(Boolean)

    if (titulo.trim().length < 3 || ingredientes.length === 0 || pasosLista.length === 0) {
      toast.error("Completá el título, al menos un ingrediente y un paso")
      return
    }

    const base = {
      titulo: titulo.trim(),
      tipo,
      tono,
      minutos: Math.max(1, Math.round(numero(minutos) ?? 30)),
      porciones: Math.max(1, Math.round(numero(porciones) ?? 2)),
      ingredientes,
      pasos: pasosLista,
      tips: tips.trim() || null,
      nutricion: nutricionActiva ? nutricionDesdeForm(nutricion) : null,
      herramientas: herramientas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      vaso: vaso.trim() || null,
      tecnica: tecnica.trim() || null,
    }

    if (receta) {
      editar.mutate({ id: receta.id, ...base })
    } else {
      crear.mutate({ ...base, origen: "manual", puntaje: 0 })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {receta ? "Editar receta" : "Nueva receta"}
          </DialogTitle>
          <DialogDescription>
            Cargá ingredientes, pasos y tiempos. Después podés cocinarla desde el
            recetario.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            enviar()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="receta-titulo">Título</Label>
            <Input
              id="receta-titulo"
              autoFocus
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Arroz revuelto con huevo"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="receta-tipo">Tipo</Label>
              <select
                id="receta-tipo"
                value={tipo}
                onChange={(event) => setTipo(event.target.value as TipoReceta)}
                className={CAMPO}
              >
                {TIPOS_RECETA.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receta-tono">Tono</Label>
              <select
                id="receta-tono"
                value={tono}
                onChange={(event) => setTono(event.target.value as TonoReceta)}
                className={CAMPO}
              >
                {TONOS.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receta-minutos">Minutos</Label>
              <Input
                id="receta-minutos"
                type="number"
                min="1"
                max="600"
                value={minutos}
                onChange={(event) => setMinutos(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receta-porciones">Porciones</Label>
              <Input
                id="receta-porciones"
                type="number"
                min="1"
                max="24"
                value={porciones}
                onChange={(event) => setPorciones(event.target.value)}
              />
            </div>
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Ingredientes
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2 text-[9px] font-bold"
                onClick={() => setFilas((anterior) => [...anterior, { ...FILA_VACIA }])}
              >
                <Plus className="size-3" aria-hidden="true" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {filas.map((fila, indice) => (
                <div
                  key={indice}
                  className="grid grid-cols-[1fr_4.5rem_5.5rem_auto_auto] items-center gap-1.5"
                >
                  <Input
                    value={fila.nombre}
                    onChange={(event) =>
                      actualizarFila(indice, { nombre: event.target.value })
                    }
                    placeholder="Ingrediente"
                    className="h-9 text-xs"
                    aria-label="Nombre del ingrediente"
                  />
                  <Input
                    value={fila.cantidad}
                    onChange={(event) =>
                      actualizarFila(indice, { cantidad: event.target.value })
                    }
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Cant."
                    className="h-9 text-xs"
                    aria-label="Cantidad"
                  />
                  <select
                    value={fila.unidad}
                    onChange={(event) =>
                      actualizarFila(indice, {
                        unidad: event.target.value as UnidadComida,
                      })
                    }
                    className={cn(CAMPO, "h-9 text-xs")}
                    aria-label="Unidad"
                  >
                    {UNIDADES.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.valor}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      actualizarFila(indice, { opcional: !fila.opcional })
                    }
                    className={cn(
                      "h-9 rounded-full px-2 text-[8px] font-bold",
                      fila.opcional
                        ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                        : "bg-surface-container text-muted-foreground",
                    )}
                    aria-label="Ingrediente opcional"
                  >
                    Opc.
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-error"
                    aria-label="Quitar ingrediente"
                    disabled={filas.length === 1}
                    onClick={() =>
                      setFilas((anterior) =>
                        anterior.filter((_, i) => i !== indice),
                      )
                    }
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-2">
            <Label htmlFor="receta-pasos">Pasos (uno por línea)</Label>
            <Textarea
              id="receta-pasos"
              value={pasos}
              onChange={(event) => setPasos(event.target.value)}
              rows={5}
              placeholder={"Calentar el aceite.\nAgregar el arroz.\n..."}
            />
          </div>

          <NutricionEditor
            idPrefix="receta"
            activa={nutricionActiva}
            onActivaChange={setNutricionActiva}
            valores={nutricion}
            onChange={(campo: CampoNutricion, valor: string) =>
              setNutricion((anterior) => ({ ...anterior, [campo]: valor }))
            }
          />

          <div className="space-y-2">
            <Label htmlFor="receta-tips">Tips</Label>
            <Textarea
              id="receta-tips"
              value={tips}
              onChange={(event) => setTips(event.target.value)}
              rows={2}
            />
          </div>

          {tipo === "trago" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="receta-herramientas">
                  Herramientas (separadas por coma)
                </Label>
                <Input
                  id="receta-herramientas"
                  value={herramientas}
                  onChange={(event) => setHerramientas(event.target.value)}
                  placeholder="Shaker, colador, bar spoon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receta-vaso">Vaso</Label>
                <Input
                  id="receta-vaso"
                  value={vaso}
                  onChange={(event) => setVaso(event.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="receta-tecnica">Técnica</Label>
                <Input
                  id="receta-tecnica"
                  value={tecnica}
                  onChange={(event) => setTecnica(event.target.value)}
                  placeholder="Agitado, directo, muddlé..."
                />
              </div>
            </div>
          ) : null}

          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : receta ? (
                <Save className="size-4" aria-hidden="true" />
              ) : (
                <ChefHat className="size-4" aria-hidden="true" />
              )}
              {guardando
                ? "Guardando..."
                : receta
                  ? "Guardar cambios"
                  : "Crear receta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
