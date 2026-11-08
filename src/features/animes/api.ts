import { queryOptions } from "@tanstack/react-query"

import { getResumenAnimes } from "./server/functions"

export const resumenAnimesQuery = queryOptions({
  queryKey: ["animes", "resumen"],
  queryFn: () => getResumenAnimes(),
  staleTime: 5 * 60_000,
})
