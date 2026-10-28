"use client";

import { Toast } from "@base-ui/react/toast";

type ToastType = "success" | "error" | "warning" | "info" | "destructive";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  title?: string;
  description?: string;
  timeout?: number;
  action?: ToastAction;
}

export function useToast() {
  const manager = Toast.useToastManager();

  function agregar(
    type: ToastType,
    options: ToastOptions,
    timeoutPorDefecto: number,
  ) {
    let id = "";

    id = manager.add({
      title: options.title,
      description: options.description,
      type,
      timeout: options.timeout ?? (options.action ? 8000 : timeoutPorDefecto),
      actionProps: options.action
        ? {
            children: options.action.label,
            onClick: () => {
              options.action?.onClick();
              manager.close(id);
            },
          }
        : undefined,
    });

    return id;
  }

  return {
    show: (options: ToastOptions & { type?: ToastType }) =>
      agregar(options.type ?? "info", options, 4000),
    success: (title: string, options?: Omit<ToastOptions, "title">) =>
      agregar("success", { ...options, title }, 4000),
    error: (title: string, options?: Omit<ToastOptions, "title">) =>
      agregar("error", { ...options, title }, 5000),
    warning: (title: string, options?: Omit<ToastOptions, "title">) =>
      agregar("warning", { ...options, title }, 4000),
    info: (title: string, options?: Omit<ToastOptions, "title">) =>
      agregar("info", { ...options, title }, 4000),
    dismiss: (id?: string) => manager.close(id),
  };
}
