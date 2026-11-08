import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"
import { crearTareaRapidaSchema } from "../schemas"

export const getResumenTareas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenTareas } = await import("./queries")
    return obtenerResumenTareas()
  })

export const crearTareaRapida = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(crearTareaRapidaSchema)
  .handler(async ({ data }) => {
    const { crearTareaRapidaEnDb } = await import("./crear")
    return crearTareaRapidaEnDb(data)
  })
