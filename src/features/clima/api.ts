import { queryOptions } from "@tanstack/react-query"

import { getResumenClima, getWorkspaceClima } from "./server/functions"

export const resumenClimaQuery = queryOptions({
  queryKey: ["clima", "resumen"],
  queryFn: () => getResumenClima(),
  staleTime: 10 * 60_000,
})

export const workspaceClimaQuery = queryOptions({
  queryKey: ["clima", "workspace"],
  queryFn: () => getWorkspaceClima(),
  staleTime: 10 * 60_000,
})
