import { z } from "zod";
import {
  prioridades,
  tiposVista,
  type Prioridad,
  type TipoVista,
} from "@/modules/tareas/constantes";

export const filtrosVencimiento = [
  "vencidas",
  "hoy",
  "semana",
  "sin_fecha",
] as const;
export type FiltroVencimiento = (typeof filtrosVencimiento)[number];

export const agrupaciones = [
  "estado",
  "prioridad",
  "etiqueta",
  "proyecto",
  "ninguna",
] as const;
export type Agrupacion = (typeof agrupaciones)[number];

export const ordenesTarea = [
  "manual",
  "fechaLimite",
  "completada",
  "prioridad",
  "creado",
  "titulo",
] as const;
export type OrdenTarea = (typeof ordenesTarea)[number];

export const sentidosOrden = ["asc", "desc"] as const;
export type SentidoOrden = (typeof sentidosOrden)[number];

export const columnasTabla = [
  "estado",
  "prioridad",
  "etiquetas",
  "fechaInicio",
  "fechaLimite",
  "subtareas",
  "actualizada",
] as const;
export type ColumnaTabla = (typeof columnasTabla)[number];

export const etiquetasColumna: Record<ColumnaTabla, string> = {
  estado: "Estado",
  prioridad: "Prioridad",
  etiquetas: "Etiquetas",
  fechaInicio: "Inicio",
  fechaLimite: "Vence",
  subtareas: "Subtareas",
  actualizada: "Actualizada",
};

export const etiquetasAgrupacion: Record<Agrupacion, string> = {
  estado: "Estado",
  prioridad: "Prioridad",
  etiqueta: "Etiqueta",
  proyecto: "Proyecto",
  ninguna: "Sin agrupar",
};

export const etiquetasOrden: Record<OrdenTarea, string> = {
  manual: "Manual",
  fechaLimite: "Fecha límite",
  completada: "Completada el",
  prioridad: "Prioridad",
  creado: "Creación",
  titulo: "Título",
};

export type FiltrosVista = {
  estados: number[];
  prioridades: Prioridad[];
  etiquetas: number[];
  vencimiento: FiltroVencimiento | null;
  busqueda: string;
};

export type ConfigVista = {
  filtros: FiltrosVista;
  agruparPor: Agrupacion;
  orden: OrdenTarea;
  sentido: SentidoOrden;
  mostrarCompletadas: boolean;
  mostrarSubtareas: boolean;
  columnas: ColumnaTabla[];
};

const filtrosSchema = z.object({
  estados: z.array(z.number().int().positive()).default([]),
  prioridades: z.array(z.enum(prioridades)).default([]),
  etiquetas: z.array(z.number().int().positive()).default([]),
  vencimiento: z.enum(filtrosVencimiento).nullable().default(null),
  busqueda: z.string().max(100).default(""),
});

export const configVistaSchema = z.object({
  filtros: filtrosSchema.default({
    estados: [],
    prioridades: [],
    etiquetas: [],
    vencimiento: null,
    busqueda: "",
  }),
  agruparPor: z.enum(agrupaciones).default("estado"),
  orden: z.enum(ordenesTarea).default("manual"),
  sentido: z.enum(sentidosOrden).default("asc"),
  mostrarCompletadas: z.boolean().default(false),
  mostrarSubtareas: z.boolean().default(true),
  columnas: z.array(z.enum(columnasTabla)).default([...columnasTabla]),
});

export const configVistaBase: ConfigVista = {
  filtros: {
    estados: [],
    prioridades: [],
    etiquetas: [],
    vencimiento: null,
    busqueda: "",
  },
  agruparPor: "estado",
  orden: "manual",
  sentido: "asc",
  mostrarCompletadas: false,
  mostrarSubtareas: true,
  columnas: [...columnasTabla],
};

export function clonarConfig(config: ConfigVista): ConfigVista {
  return {
    ...config,
    filtros: {
      ...config.filtros,
      estados: [...config.filtros.estados],
      prioridades: [...config.filtros.prioridades],
      etiquetas: [...config.filtros.etiquetas],
    },
    columnas: [...config.columnas],
  };
}

export function configParaTipo(tipo: TipoVista): ConfigVista {
  const base = clonarConfig(configVistaBase);
  switch (tipo) {
    case "lista":
      return { ...base, agruparPor: "estado", mostrarSubtareas: true };
    case "tablero":
      return {
        ...base,
        agruparPor: "estado",
        orden: "manual",
        mostrarSubtareas: false,
      };
    case "tabla":
      return {
        ...base,
        agruparPor: "ninguna",
        mostrarSubtareas: false,
        columnas: [...columnasTabla],
      };
    case "calendario":
      return {
        ...base,
        agruparPor: "ninguna",
        mostrarSubtareas: false,
      };
    case "cronograma":
      return {
        ...base,
        agruparPor: "estado",
        mostrarSubtareas: false,
      };
  }
}

export function parseConfigVista(raw: unknown): ConfigVista {
  let valor = raw;
  if (typeof raw === "string") {
    try {
      valor = JSON.parse(raw);
    } catch {
      valor = null;
    }
  }
  const parsed = configVistaSchema.safeParse(valor);
  return parsed.success ? parsed.data : clonarConfig(configVistaBase);
}

export type VistaPorDefecto = {
  nombre: string;
  tipo: TipoVista;
  config: ConfigVista;
  predeterminada: boolean;
};

export function vistasIniciales(): VistaPorDefecto[] {
  return tiposVista.map((tipo, indice) => ({
    nombre:
      tipo === "lista"
        ? "Lista"
        : tipo === "tablero"
          ? "Tablero"
          : tipo === "tabla"
            ? "Tabla"
            : tipo === "calendario"
              ? "Calendario"
              : "Cronograma",
    tipo,
    config: configParaTipo(tipo),
    predeterminada: indice === 0,
  }));
}

// une una config guardada con cambios parciales de la UI sin perder defaults
export function fusionarConfig(
  base: ConfigVista,
  cambios: Partial<ConfigVista>,
): ConfigVista {
  const parsed = configVistaSchema.safeParse({
    ...base,
    ...cambios,
    filtros: { ...base.filtros, ...(cambios.filtros ?? {}) },
  });
  return parsed.success ? parsed.data : clonarConfig(base);
}
