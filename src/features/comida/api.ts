import { queryOptions } from "@tanstack/react-query"

import { getResumenComida, getWorkspaceComida } from "./server/functions"

export const resumenComidaQuery = queryOptions({
  queryKey: ["comida", "resumen"],
  queryFn: () => getResumenComida(),
  staleTime: 60_000,
})

export const workspaceComidaQuery = (semana?: string) =>
  queryOptions({
    queryKey: ["comida", "workspace", semana ?? "actual"],
    queryFn: () => getWorkspaceComida({ data: { semana } }),
    staleTime: 60_000,
  })
