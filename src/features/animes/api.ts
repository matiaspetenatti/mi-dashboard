import { queryOptions } from "@tanstack/react-query"

import {
  buscarKitsu,
  getCalendarioAnimes,
  getDetalleKitsu,
  getResumenAnimes,
  getWorkspaceAnimes,
} from "./server/functions"

export const resumenAnimesQuery = queryOptions({
  queryKey: ["animes", "resumen"],
  queryFn: () => getResumenAnimes(),
  staleTime: 5 * 60_000,
})

export const workspaceAnimesQuery = queryOptions({
  queryKey: ["animes", "workspace"],
  queryFn: () => getWorkspaceAnimes(),
  staleTime: 60_000,
})

export const kitsuBusquedaQuery = (texto: string) =>
  queryOptions({
    queryKey: ["animes-kitsu", "busqueda", texto],
    queryFn: () => buscarKitsu({ data: { q: texto } }),
    staleTime: 10 * 60_000,
    enabled: texto.trim().length >= 2,
  })

export const kitsuDetalleQuery = (id: number | null) =>
  queryOptions({
    queryKey: ["animes-kitsu", "detalle", id],
    queryFn: () => getDetalleKitsu({ data: { id: id as number } }),
    staleTime: 60 * 60_000,
    enabled: id !== null,
  })

export const calendarioAnimesQuery = queryOptions({
  queryKey: ["animes-calendario"],
  queryFn: () => getCalendarioAnimes({ data: { forzar: false } }),
  staleTime: 30 * 60_000,
})
