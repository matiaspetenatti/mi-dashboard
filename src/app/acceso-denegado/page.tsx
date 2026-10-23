import { SignOutButton } from "@clerk/nextjs";
import { ShieldX } from "lucide-react";

export default function AccesoDenegadoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant/50 bg-surface-container-low/80 p-8 text-center shadow-elevation-2 backdrop-blur-xl">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX size={26} />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          Acceso denegado
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          Esta cuenta no está autorizada para entrar a este dashboard. Si
          creés que es un error, iniciá sesión con el email autorizado.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button className="mt-6 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90">
            Cerrar sesión e intentar con otra cuenta
          </button>
        </SignOutButton>
      </div>
    </main>
  );
}
