import { queryOptions } from "@tanstack/react-query"

import {
  getResumenEstudio,
  getWorkspaceEstudio,
} from "./server/functions"

export const resumenEstudioQuery = queryOptions({
  queryKey: ["estudio", "resumen"],
  queryFn: () => getResumenEstudio(),
  staleTime: 60_000,
})

export const workspaceEstudioQuery = queryOptions({
  queryKey: ["estudio", "workspace"],
  queryFn: () => getWorkspaceEstudio(),
  staleTime: 60_000,
})
