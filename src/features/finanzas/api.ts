import { queryOptions } from "@tanstack/react-query"

import { getResumenFinanzas } from "./server/functions"

export const resumenFinanzasQuery = queryOptions({
  queryKey: ["finanzas", "resumen"],
  queryFn: () => getResumenFinanzas(),
  staleTime: 60_000,
})
