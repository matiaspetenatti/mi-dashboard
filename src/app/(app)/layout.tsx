import { Suspense } from "react";
import { AppFooter } from "@/components/app-footer";
import { MobileHeader, MobileNav, Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SincronizacionDiariaFinanzas } from "@/modules/finanzas/sincronizacion-diaria";
import { getProyectosConResumen, getResumenGlobal } from "@/modules/tareas/queries";
import {
  proyectosNavegacion,
  resumenNavegacion,
  type NavegacionTareas,
} from "@/modules/tareas/lib/navegacion";
import { requireAuthorizedUser } from "@/lib/auth";

async function AppBody({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthorizedUser();

  let pendientes = 0;
  let navegacionTareas: NavegacionTareas | null = null;
  try {
    const [proyectos, resumen] = await Promise.all([
      getProyectosConResumen(),
      getResumenGlobal(),
    ]);
    pendientes = resumen.pendientes;
    navegacionTareas = {
      resumen: resumenNavegacion(resumen),
      proyectos: proyectosNavegacion(proyectos),
    };
  } catch {
    // Si la base no responde, el sidebar igual debe renderizarse.
    pendientes = 0;
    navegacionTareas = null;
  }

  return (
    <MotionProvider>
      <SincronizacionDiariaFinanzas />
      <div className="relative z-10 flex min-h-screen">
        <Suspense
          fallback={
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-outline-variant/50 bg-card md:flex" />
          }
        >
          <Sidebar pendientes={pendientes} tareas={navegacionTareas} />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense
            fallback={
              <header className="sticky top-0 z-30 h-[61px] border-b border-outline-variant/50 bg-surface/90 md:hidden" />
            }
          >
            <MobileHeader />
          </Suspense>

          <Topbar />

          <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
            <div className="mx-auto w-full max-w-[1580px]">
              {children}
              <AppFooter />
            </div>
          </main>
        </div>

        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </div>
    </MotionProvider>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen">Cargando...</div>}>
      <AppBody>{children}</AppBody>
    </Suspense>
  );
}
