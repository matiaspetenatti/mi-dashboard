import { queryOptions } from "@tanstack/react-query"

import {
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
