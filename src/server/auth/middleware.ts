import { createMiddleware } from "@tanstack/react-start"

export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { getAccess } = await import("@/server/auth/access")
    const access = await getAccess()

    if (access.status === "signed-out") {
      throw new Error("UNAUTHORIZED")
    }

    if (access.status === "forbidden") {
      throw new Error("FORBIDDEN")
    }

    return next({ context: { viewer: access } })
  },
)
