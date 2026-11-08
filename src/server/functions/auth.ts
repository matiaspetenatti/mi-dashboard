import { createServerFn } from "@tanstack/react-start"

/**
 * Server function pública: la usan el guard de rutas y el shell para saber
 * quién está autenticado. No devuelve datos del dashboard.
 */
export const getViewer = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getAccess } = await import("@/server/auth/access")
    return getAccess()
  },
)
