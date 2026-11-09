import { keepPreviousData, queryOptions } from "@tanstack/react-query"

import type { MovimientosFinanzasInput } from "./schemas"
import {
  getMovimientosFinanzas,
  getResumenFinanzas,
  getWorkspaceFinanzas,
} from "./server/functions"

export const resumenFinanzasQuery = queryOptions({
  queryKey: ["finanzas", "resumen"],
  queryFn: () => getResumenFinanzas(),
  staleTime: 60_000,
})

export const workspaceFinanzasQuery = queryOptions({
  queryKey: ["finanzas", "workspace"],
  queryFn: () => getWorkspaceFinanzas(),
  staleTime: 60_000,
})

export const movimientosFinanzasQuery = (input: MovimientosFinanzasInput) =>
  queryOptions({
    queryKey: ["finanzas", "movimientos", input],
    queryFn: () => getMovimientosFinanzas({ data: input }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
