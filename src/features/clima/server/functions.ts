import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"

export const getResumenClima = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenClima } = await import("./queries")
    return obtenerResumenClima()
  })
