import { queryOptions } from "@tanstack/react-query"

import { getResumenClima } from "./server/functions"

export const resumenClimaQuery = queryOptions({
  queryKey: ["clima", "resumen"],
  queryFn: () => getResumenClima(),
  staleTime: 10 * 60_000,
})
