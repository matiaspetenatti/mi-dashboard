import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"

export const getResumenFinanzas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenFinanzas } = await import("./queries")
    return obtenerResumenFinanzas()
  })
