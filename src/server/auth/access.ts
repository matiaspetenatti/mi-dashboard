import "@tanstack/react-start/server-only"

import { auth, clerkClient } from "@clerk/tanstack-react-start/server"

import { getAuthorizedEmails } from "@/server/env"

export type Viewer = {
  userId: string
  email: string
  name: string | null
  imageUrl: string | null
}

export type AccessResult =
  | ({ status: "authorized" } & Viewer)
  | { status: "signed-out" }
  | { status: "forbidden"; email: string | null }

type CachedUser = Omit<Viewer, "userId"> & { expiresAt: number }

const userCache = new Map<string, CachedUser>()
const USER_CACHE_TTL = 5 * 60 * 1000

async function getClerkUser(userId: string): Promise<CachedUser | null> {
  const cached = userCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached

  try {
    const user = await clerkClient().users.getUser(userId)
    const emails = user.emailAddresses.map((address) => address.emailAddress)
    const primaryEmail =
      user.emailAddresses.find(
        (address) => address.id === user.primaryEmailAddressId,
      )?.emailAddress ??
      emails.at(0) ??
      null

    if (!primaryEmail) return null

    const nombre = [user.firstName, user.lastName].filter(Boolean).join(" ")
    const entry: CachedUser = {
      email: primaryEmail,
      name: nombre || user.username || null,
      imageUrl: user.imageUrl || null,
      expiresAt: Date.now() + USER_CACHE_TTL,
    }

    userCache.set(userId, entry)
    return entry
  } catch (error) {
    console.warn("[auth] No se pudo leer el usuario de Clerk", error)
    return null
  }
}

/**
 * Resuelve el acceso del request actual.
 * Falla cerrado: si AUTHORIZED_EMAILS está vacío, nadie entra.
 */
export async function getAccess(): Promise<AccessResult> {
  const { userId } = await auth()

  if (!userId) return { status: "signed-out" }

  const user = await getClerkUser(userId)
  if (!user) return { status: "signed-out" }

  const authorizedEmails = getAuthorizedEmails()
  const emailIsAuthorized =
    authorizedEmails.size > 0 && authorizedEmails.has(user.email.toLowerCase())

  if (!emailIsAuthorized) {
    return { status: "forbidden", email: user.email }
  }

  return {
    status: "authorized",
    userId,
    ...user,
  }
}
