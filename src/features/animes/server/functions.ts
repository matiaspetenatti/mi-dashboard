import { createServerFn } from "@tanstack/react-start"

import { authMiddleware } from "@/server/auth/middleware"

export const getResumenAnimes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { obtenerResumenAnimes } = await import("./queries")
    return obtenerResumenAnimes()
  })
