import { queryOptions } from "@tanstack/react-query"

import { getResumenHabitos, getWorkspaceHabitos } from "./server/functions"

export const resumenHabitosQuery = queryOptions({
  queryKey: ["habitos", "resumen"],
  queryFn: () => getResumenHabitos(),
  staleTime: 60_000,
})

export const workspaceHabitosQuery = queryOptions({
  queryKey: ["habitos", "workspace"],
  queryFn: () => getWorkspaceHabitos(),
  staleTime: 60_000,
})
