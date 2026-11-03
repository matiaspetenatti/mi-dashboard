"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import {
  exportarTareasCSV,
  importarTareasCSV,
} from "@/modules/tareas/actions/import-export";
import { useToast } from "@/hooks/use-toast";

export function ImportExport() {
  const [pendiente, startTransition] = useTransition();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  function exportar() {
    startTransition(async () => {
      const csv = await exportarTareasCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tareas.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function alSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const texto = String(reader.result ?? "");
      startTransition(async () => {
        const r = await importarTareasCSV(texto);
        if (!r.ok) {
          toast.error(r.error ?? "No se pudo importar");
          return;
        }
        toast.success(`Importadas ${r.creadas} tareas`, {
          description:
            r.errores.length > 0 ? r.errores.slice(0, 3).join("; ") : undefined,
        });
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-outline-variant/50 bg-card p-4">
      <button
        type="button"
        disabled={pendiente}
        onClick={exportar}
        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-surface-container"
      >
        <Download size={13} />
        Exportar CSV
      </button>
      <button
        type="button"
        disabled={pendiente}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-surface-container"
      >
        <Upload size={13} />
        Importar CSV
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={alSeleccionarArchivo}
      />
      <a
        href="/api/tareas/ical"
        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-surface-container"
      >
        Exportar iCal
      </a>
    </div>
  );
}