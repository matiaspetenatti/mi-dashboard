import { clerkMiddleware } from "@clerk/nextjs/server";

const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/acceso-denegado", "/__clerk"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Solo hacemos el redirect temprano para navegaciones de páginas. Los
  // Route Handlers y Server Actions validan el acceso por su cuenta.
  if (pathname.startsWith("/api") || isPublicPath(pathname)) return;

  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
