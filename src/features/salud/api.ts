import { queryOptions } from "@tanstack/react-query"

import { getResumenSalud, getWorkspaceSalud } from "./server/functions"

export const resumenSaludQuery = queryOptions({
  queryKey: ["salud", "resumen"],
  queryFn: () => getResumenSalud(),
  staleTime: 60_000,
})

export const workspaceSaludQuery = queryOptions({
  queryKey: ["salud", "workspace"],
  queryFn: () => getWorkspaceSalud(),
  staleTime: 60_000,
})
