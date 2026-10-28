import { Suspense } from "react";
import { MobileHeader, MobileNav, Sidebar } from "@/components/sidebar";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SincronizacionDiariaFinanzas } from "@/modules/finanzas/sincronizacion-diaria";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthorizedUser();

  return (
    <MotionProvider>
      <SincronizacionDiariaFinanzas />
      <div className="relative z-10 flex min-h-screen">
        <Suspense
          fallback={
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-outline-variant/50 bg-surface-container-low/70 md:flex" />
          }
        >
          <Sidebar />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense
            fallback={
              <header className="sticky top-0 z-30 h-[65px] border-b border-outline-variant/40 bg-background/75 md:hidden" />
            }
          >
            <MobileHeader />
          </Suspense>

          <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>

        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </div>
    </MotionProvider>
  );
}
