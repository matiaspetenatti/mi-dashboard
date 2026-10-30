import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { cache } from "react";

const authorizedEmails = (process.env.AUTHORIZED_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export type AccessResult =
  | { status: "authorized"; userId: string; email: string }
  | { status: "signed-out" }
  | { status: "forbidden"; email: string | null };

/**
 * Versión cacheada de currentUser() para deduplicar llamadas concurrentes
 * dentro del mismo render tree y evitar errores de "operation aborted".
 */
const getCachedCurrentUser = cache(async () => {
  try {
    return await currentUser();
  } catch (err) {
    // Si la request fue abortada (navegación, timeout, etc.) devolvemos null
    // en lugar de explotar. El caller tratará esto como "not found".
    console.warn("[auth] currentUser() falló, tratando como null:", err);
    return null;
  }
});

/**
 * Resuelve el acceso del request actual.
 * No se cachea porque auth() lee headers/cookies.
 */
export async function getAccess(): Promise<AccessResult> {
  // TEMPORAL: bypass local para pruebas de UI con el servidor de desarrollo.
  // No aplica en producción ni sin la variable de entorno.
  if (process.env.COMIDA_DEV_BYPASS === "1") {
    return {
      status: "authorized",
      userId: "prueba-local",
      email: "prueba@local",
    };
  }

  const { userId } = await auth();

  if (!userId) return { status: "signed-out" };

  const user = await getCachedCurrentUser();
  if (!user) return { status: "signed-out" };
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;

  const emailIsAuthorized =
    authorizedEmails.length > 0 &&
    (user?.emailAddresses ?? []).some((address) =>
      authorizedEmails.includes(address.emailAddress.toLowerCase()),
    );

  if (!emailIsAuthorized) {
    return { status: "forbidden", email: primaryEmail };
  }

  return {
    status: "authorized",
    userId,
    email: primaryEmail ?? authorizedEmails[0],
  };
}

/**
 * Para páginas y server actions: redirige al login o a la pantalla de acceso
 * denegado. Falla cerrado si `AUTHORIZED_EMAILS` no está configurado.
 */
export async function requireAuthorizedUser() {
  const access = await getAccess();

  if (access.status === "authorized") return access;
  if (access.status === "signed-out") redirect("/sign-in");

  redirect("/acceso-denegado");
}

/**
 * Para Route Handlers: devuelve una respuesta 401/403 o `null` si el request
 * está autorizado.
 */
export async function rejectUnauthorizedRequest(): Promise<NextResponse | null> {
  const access = await getAccess();

  if (access.status === "authorized") return null;

  return NextResponse.json(
    {
      error:
        access.status === "signed-out"
          ? "No autenticado"
          : "Acceso denegado",
    },
    { status: access.status === "signed-out" ? 401 : 403 },
  );
}
