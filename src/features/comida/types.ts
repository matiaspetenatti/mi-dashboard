import type {
  ItemComida,
  ItemListaComida,
  RecetaComida,
  SlotMenuComida,
} from "@/server/db/schema"
import type { VistaComida } from "./constantes"

export type { VistaComida }

export type KpisComida = {
  items: number
  porVencer: number
  recetas: number
  comprasPendientes: number
  totalCompraCentavos: number
}

export type WorkspaceComida = {
  hoy: string
  semana: string
  dias: string[]
  items: ItemComida[]
  recetas: RecetaComida[]
  menu: SlotMenuComida[]
  lista: ItemListaComida[]
  kpis: KpisComida
}

export type ResumenComidaWidget = {
  hoy: string
  items: number
  porVencer: number
  recetas: number
  comprasPendientes: number
  totalCompraCentavos: number
  menuHoy: SlotMenuComida[]
}
