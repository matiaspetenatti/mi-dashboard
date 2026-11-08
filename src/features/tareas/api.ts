import { queryOptions } from "@tanstack/react-query"

import { getResumenTareas, getWorkspaceTareas } from "./server/functions"

export const resumenTareasQuery = queryOptions({
  queryKey: ["tareas", "resumen"],
  queryFn: () => getResumenTareas(),
  staleTime: 30_000,
})

export const workspaceTareasQuery = queryOptions({
  queryKey: ["tareas", "workspace"],
  queryFn: () => getWorkspaceTareas(),
  staleTime: 30_000,
})
