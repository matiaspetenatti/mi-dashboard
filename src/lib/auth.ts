import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

const authorizedEmails = (process.env.AUTHORIZED_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export type AccessResult =
  | { status: "authorized"; userId: string; email: string }
  | { status: "signed-out" }
  | { status: "forbidden"; email: string | null };

/**
 * Resuelve el acceso del request actual.
 * No se cachea porque auth() lee headers/cookies.
 */
export async function getAccess(): Promise<AccessResult> {
  const { userId } = await auth();

  if (!userId) return { status: "signed-out" };

  const user = await currentUser();
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
