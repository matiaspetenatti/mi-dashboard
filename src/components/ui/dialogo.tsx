"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "cn";

type DialogoProps = {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  className?: string;
};

export function Dialogo({
  abierto,
  onOpenChange,
  titulo,
  descripcion,
  children,
  className,
}: DialogoProps) {
  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-[91] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 text-on-surface shadow-elevation-4 outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
            className,
          )}
        >
          <Dialog.Title className="text-lg font-semibold tracking-tight">
            {titulo}
          </Dialog.Title>
          {descripcion && (
            <Dialog.Description className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              {descripcion}
            </Dialog.Description>
          )}
          <div className="mt-4">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
