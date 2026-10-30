import { clerkMiddleware } from "@clerk/nextjs/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const secretKey = process.env.CLERK_SECRET_KEY?.trim();

// Las claves de Clerk son ASCII. Si se pega la versión enmascarada del
// dashboard (por ejemplo `sk_live_…`), el proxy de Clerk falla al construir
// el header `Clerk-Secret-Key` con un error de ByteString poco claro.
if (secretKey && /[^\x20-\x7E]/.test(secretKey)) {
  console.error(
    "[clerk] CLERK_SECRET_KEY contiene caracteres no ASCII (¿copiaste la versión enmascarada con '…'?). " +
      "Copiá la clave completa desde Clerk Dashboard → API Keys.",
  );
}

const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/acceso-denegado", "/__clerk"];

function isPublicPath(pathname: string) {
  // TEMPORAL: permite renderizar las vistas de prueba sin sesión de Clerk.
  if (
    process.env.COMIDA_DEV_BYPASS === "1" &&
    (pathname === "/" || pathname.startsWith("/comida"))
  ) {
    return true;
  }

  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default clerkMiddleware(
  async (auth, req) => {
    const { pathname } = req.nextUrl;

    // Solo hacemos el redirect temprano para navegaciones de páginas. Los
    // Route Handlers y Server Actions validan el acceso por su cuenta.
    if (pathname.startsWith("/api") || isPublicPath(pathname)) return;

    const { isAuthenticated, redirectToSignIn } = await auth();
    if (!isAuthenticated) return redirectToSignIn();
  },
  { publishableKey, secretKey },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
