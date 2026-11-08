import { queryOptions } from "@tanstack/react-query"

import { getResumenEstudio } from "./server/functions"

export const resumenEstudioQuery = queryOptions({
  queryKey: ["estudio", "resumen"],
  queryFn: () => getResumenEstudio(),
  staleTime: 60_000,
})
