"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "cn";

const CerrarMenu = createContext<() => void>(() => {});

type MenuProps = {
  trigger: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
  triggerClassName?: string;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
};

export function Menu({
  trigger,
  children,
  ariaLabel,
  triggerClassName,
  className,
  align = "start",
  side = "bottom",
}: MenuProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl outline-none transition-colors focus-visible:ring-4 focus-visible:ring-primary/20",
          triggerClassName,
        )}
      >
        {trigger}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side={side}
          align={align}
          sideOffset={6}
          className="z-[95] outline-none"
        >
          <Popover.Popup
            className={cn(
              "min-w-52 origin-[var(--transform-origin)] rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-1.5 text-sm text-on-surface shadow-elevation-3 outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
              className,
            )}
          >
            <CerrarMenu.Provider value={() => setAbierto(false)}>
              {children}
            </CerrarMenu.Provider>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function MenuItem({
  children,
  onClick,
  className,
  peligro = false,
  activo = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  peligro?: boolean;
  activo?: boolean;
}) {
  const cerrar = useContext(CerrarMenu);

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        cerrar();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors hover:bg-on-surface/5",
        activo && "bg-primary-container/60 text-on-primary-container",
        peligro ? "text-error hover:bg-error-container/50" : "text-on-surface",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MenuEtiqueta({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant/70">
      {children}
    </p>
  );
}

export function MenuSeparador() {
  return <div className="my-1.5 h-px bg-outline-variant/50" />;
}

export function MenuVacio({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 py-3 text-xs text-on-surface-variant">{children}</p>
  );
}
