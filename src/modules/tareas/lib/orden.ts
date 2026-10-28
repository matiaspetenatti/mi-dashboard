import type { EstadoProyecto } from "@/modules/tareas/schema";

export const PASO_POSICION = 1024;

export function siguientePosicion(items: Array<{ posicion: number }>) {
  if (items.length === 0) return PASO_POSICION;
  return Math.max(...items.map((item) => item.posicion)) + PASO_POSICION;
}

export function estadoInicial(estados: EstadoProyecto[]) {
  return (
    [...estados]
      .filter((estado) => estado.categoria === "pendiente")
      .sort((a, b) => a.posicion - b.posicion)[0] ??
    [...estados].sort((a, b) => a.posicion - b.posicion)[0]
  );
}

export function estadoCompletado(estados: EstadoProyecto[]) {
  return [...estados]
    .filter((estado) => estado.categoria === "completado")
    .sort((a, b) => a.posicion - b.posicion)[0];
}

export function estadoParaCategoria(
  estados: EstadoProyecto[],
  categoria: EstadoProyecto["categoria"],
) {
  return [...estados]
    .filter((estado) => estado.categoria === categoria)
    .sort((a, b) => a.posicion - b.posicion)[0];
}

export function esCompletada(estado: Pick<EstadoProyecto, "categoria">) {
  return estado.categoria === "completado";
}

export function cuentaComoPendiente(
  estado: Pick<EstadoProyecto, "categoria">,
) {
  return estado.categoria === "pendiente" || estado.categoria === "en_progreso";
}
