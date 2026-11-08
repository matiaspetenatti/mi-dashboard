import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"

export const getResumenEstudio = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenEstudio } = await import("./queries")
    return obtenerResumenEstudio()
  })
