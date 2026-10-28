"use client";

import { Toast } from "@base-ui/react/toast";
import { cn } from "cn";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";

function ToastIcon({ type }: { type?: string }) {
  if (type === "success") {
    return <CheckCircle2 className="size-4 text-[var(--success)]" />;
  }
  if (type === "error" || type === "destructive") {
    return <XCircle className="size-4 text-[var(--error)]" />;
  }
  if (type === "warning") {
    return <AlertCircle className="size-4 text-[var(--warning)]" />;
  }
  return <Info className="size-4 text-[var(--primary)]" />;
}

function ToastItem({
  toast,
}: {
  toast: Toast.Root.ToastObject<Record<string, unknown>>;
}) {
  const type = toast.type;

  return (
    <Toast.Root
      toast={toast}
      className={cn(
        "group pointer-events-auto relative flex w-full max-w-[420px] items-start gap-2.5 overflow-hidden rounded-xl border p-3 shadow-[var(--elev-3)] transition-all data-[ending-style]:opacity-0 data-[ending-style]:translate-x-2 data-[starting-style]:translate-x-2 data-[starting-style]:opacity-0",
        type === "success" &&
          "border-[color-mix(in_oklab,var(--success)_25%,var(--border))] bg-[color-mix(in_oklab,var(--success-container)_40%,var(--surface-container-lowest))]",
        type === "error" || type === "destructive"
          ? "border-[color-mix(in_oklab,var(--error)_25%,var(--border))] bg-[color-mix(in_oklab,var(--error-container)_40%,var(--surface-container-lowest))]"
          : type === "warning"
            ? "border-[color-mix(in_oklab,var(--warning)_25%,var(--border))] bg-[color-mix(in_oklab,var(--warning-container)_40%,var(--surface-container-lowest))]"
            : "border-border bg-surface-container-lowest"
      )}
    >
      <div className="mt-0.5">
        <ToastIcon type={type} />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        {toast.title && (
          <Toast.Title className="text-sm font-medium leading-tight text-on-surface">
            {toast.title}
          </Toast.Title>
        )}
        {toast.description && (
          <Toast.Description className="text-xs leading-snug text-on-surface-variant">
            {toast.description}
          </Toast.Description>
        )}
      </div>
      {toast.actionProps && (
        <Toast.Action className="mt-0.5 shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10" />
      )}
      <Toast.Close className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-on-surface/5 hover:text-on-surface">
        <X className="size-3.5" />
      </Toast.Close>
    </Toast.Root>
  );
}

export function Toaster() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-[420px] flex-col gap-2 outline-none">
        {toasts.map((toast) => (
          <Toast.Positioner key={toast.id} toast={toast} className="w-full">
            <ToastItem toast={toast} />
          </Toast.Positioner>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export * from "@base-ui/react/toast";
