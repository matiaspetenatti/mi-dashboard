import type { EstadoProyecto } from "@/modules/tareas/schema";
import type { ResumenProyecto } from "@/modules/tareas/queries/proyectos";
import type { ResumenGlobal } from "@/modules/tareas/queries/tareas";

/**
 * Datos mínimos que necesita el sidebar global para mostrar las secciones
 * "Inteligentes" y "Proyectos" sin arrastrar el resumen completo de cada
 * proyecto al árbol de cliente.
 */
export type ResumenNav = Pick<
  ResumenGlobal,
  "pendientes" | "hoy" | "proximas" | "vencidas" | "sinFecha" | "completadas" | "total"
>;

export type ProyectoNav = {
  id: number;
  slug: string;
  nombre: string;
  color: string;
  icono: string;
  prefijo: string;
  archivado: boolean;
  estados: EstadoProyecto[];
  pendientes: number;
  vencidas: number;
};

export type NavegacionTareas = {
  resumen: ResumenNav;
  proyectos: ProyectoNav[];
};

export function resumenNavegacion(resumen: ResumenGlobal): ResumenNav {
  return {
    pendientes: resumen.pendientes,
    hoy: resumen.hoy,
    proximas: resumen.proximas,
    vencidas: resumen.vencidas,
    sinFecha: resumen.sinFecha,
    completadas: resumen.completadas,
    total: resumen.total,
  };
}

export function proyectosNavegacion(
  proyectos: ResumenProyecto[],
): ProyectoNav[] {
  return proyectos.map(({ proyecto, estados, pendientes, vencidas }) => ({
    id: proyecto.id,
    slug: proyecto.slug,
    nombre: proyecto.nombre,
    color: proyecto.color,
    icono: proyecto.icono,
    prefijo: proyecto.prefijo,
    archivado: proyecto.archivado,
    // Los estados se usan para resolver el estado inicial al crear una tarea.
    estados,
    pendientes,
    vencidas,
  }));
}
