import { queryOptions } from "@tanstack/react-query"

import { getResumenTareas } from "./server/functions"

export const resumenTareasQuery = queryOptions({
  queryKey: ["tareas", "resumen"],
  queryFn: () => getResumenTareas(),
  staleTime: 30_000,
})
