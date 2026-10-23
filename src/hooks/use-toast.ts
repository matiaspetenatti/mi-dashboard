"use client";

import { Toast } from "@base-ui/react/toast";

type ToastType = "success" | "error" | "warning" | "info" | "destructive";

interface ToastOptions {
  title?: string;
  description?: string;
  timeout?: number;
}

function createToast(manager: ReturnType<typeof Toast.useToastManager>) {
  return {
    show: (options: ToastOptions & { type?: ToastType }) => {
      return manager.add({
        title: options.title,
        description: options.description,
        type: options.type ?? "info",
        timeout: options.timeout ?? 4000,
      } as any);
    },
    success: (title: string, options?: Omit<ToastOptions, "title">) => {
      return manager.add({
        title,
        description: options?.description,
        type: "success",
        timeout: options?.timeout ?? 4000,
      } as any);
    },
    error: (title: string, options?: Omit<ToastOptions, "title">) => {
      return manager.add({
        title,
        description: options?.description,
        type: "error",
        timeout: options?.timeout ?? 5000,
      } as any);
    },
    warning: (title: string, options?: Omit<ToastOptions, "title">) => {
      return manager.add({
        title,
        description: options?.description,
        type: "warning",
        timeout: options?.timeout ?? 4000,
      } as any);
    },
    info: (title: string, options?: Omit<ToastOptions, "title">) => {
      return manager.add({
        title,
        description: options?.description,
        type: "info",
        timeout: options?.timeout ?? 4000,
      } as any);
    },
    dismiss: (id?: string) => manager.close(id),
  };
}

export function useToast() {
  const manager = Toast.useToastManager();
  return createToast(manager);
}
