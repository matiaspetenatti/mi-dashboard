import type {
  EstadoProyecto,
  Etiqueta,
  Prioridad,
  UnidadRecurrencia,
} from "@/modules/tareas/schema";
import type { TareaBase, TareaConDetalle } from "@/modules/tareas/queries/tareas";
import { estadoCompletado, estadoParaCategoria } from "@/modules/tareas/lib/orden";

/**
 * Cambios que la UI puede aplicar antes de que el servidor responda.
 * Los campos ausentes no se tocan.
 */
export type CambioTarea = {
  estadoId?: number;
  titulo?: string;
  prioridad?: Prioridad | null;
  fechaInicio?: string | null;
  fechaLimite?: string | null;
  recurrencia?: UnidadRecurrencia | null;
  recurrenciaCada?: number;
  etiquetaIds?: number[];
};

export type CambiosTareas = Record<number, CambioTarea>;

function aplicar<T extends TareaBase>(
  tarea: T,
  cambio: CambioTarea | undefined,
  estados: Map<number, EstadoProyecto>,
  etiquetas: Map<number, Etiqueta>,
): T {
  if (!cambio) return tarea;

  const estado = cambio.estadoId ? estados.get(cambio.estadoId) : undefined;
  const nuevasEtiquetas =
    cambio.etiquetaIds !== undefined
      ? cambio.etiquetaIds
          .map((id) => etiquetas.get(id))
          .filter((etiqueta): etiqueta is Etiqueta => Boolean(etiqueta))
      : undefined;

  // El spread conserva los campos extra del tipo original (por ejemplo, subtareas).
  return {
    ...tarea,
    ...(estado ? { estado, estadoId: estado.id } : {}),
    ...(cambio.titulo !== undefined ? { titulo: cambio.titulo } : {}),
    ...(cambio.prioridad !== undefined ? { prioridad: cambio.prioridad } : {}),
    ...(cambio.fechaInicio !== undefined
      ? { fechaInicio: cambio.fechaInicio }
      : {}),
    ...(cambio.fechaLimite !== undefined
      ? { fechaLimite: cambio.fechaLimite }
      : {}),
    ...(cambio.recurrencia !== undefined
      ? { recurrencia: cambio.recurrencia }
      : {}),
    ...(cambio.recurrenciaCada !== undefined
      ? { recurrenciaCada: cambio.recurrenciaCada }
      : {}),
    ...(nuevasEtiquetas ? { etiquetas: nuevasEtiquetas } : {}),
  } as T;
}

export function aplicarCambiosTareas(
  tareas: TareaConDetalle[],
  cambios: CambiosTareas,
  estados: EstadoProyecto[],
  etiquetas: Etiqueta[],
): TareaConDetalle[] {
  if (Object.keys(cambios).length === 0) return tareas;

  const estadosPorId = new Map(estados.map((estado) => [estado.id, estado]));
  const etiquetasPorId = new Map(etiquetas.map((etiqueta) => [etiqueta.id, etiqueta]));

  // Si el servidor ya devolvió el valor, el cambio local deja de aplicarse solo.
  const vigente = (tarea: TareaBase, cambio: CambioTarea | undefined) =>
    cambio && !coincide(tarea, cambio) ? cambio : undefined;

  return tareas.map((tarea) => {
    const actualizada = aplicar(
      tarea,
      vigente(tarea, cambios[tarea.id]),
      estadosPorId,
      etiquetasPorId,
    );

    if (tarea.subtareas.length === 0) return actualizada;

    const subtareas = tarea.subtareas.map((subtarea) =>
      aplicar(
        subtarea,
        vigente(subtarea, cambios[subtarea.id]),
        estadosPorId,
        etiquetasPorId,
      ),
    );

    const cambiaron = subtareas.some(
      (subtarea, indice) => subtarea !== tarea.subtareas[indice],
    );
    if (!cambiaron) return actualizada;

    return {
      ...actualizada,
      subtareas,
      subtareasCompletadas: subtareas.filter(
        (subtarea) => subtarea.estado.categoria === "completado",
      ).length,
    };
  });
}

function coincide(tarea: TareaBase, cambio: CambioTarea) {
  if (cambio.estadoId !== undefined && tarea.estadoId !== cambio.estadoId) {
    return false;
  }
  if (cambio.titulo !== undefined && tarea.titulo !== cambio.titulo) return false;
  if (
    cambio.prioridad !== undefined &&
    (tarea.prioridad ?? null) !== cambio.prioridad
  ) {
    return false;
  }
  if (
    cambio.fechaInicio !== undefined &&
    (tarea.fechaInicio ?? null) !== cambio.fechaInicio
  ) {
    return false;
  }
  if (
    cambio.fechaLimite !== undefined &&
    (tarea.fechaLimite ?? null) !== cambio.fechaLimite
  ) {
    return false;
  }
  if (
    cambio.recurrencia !== undefined &&
    (tarea.recurrencia ?? null) !== cambio.recurrencia
  ) {
    return false;
  }
  if (
    cambio.recurrenciaCada !== undefined &&
    tarea.recurrenciaCada !== cambio.recurrenciaCada
  ) {
    return false;
  }
  if (cambio.etiquetaIds !== undefined) {
    const actuales = tarea.etiquetas
      .map((etiqueta) => etiqueta.id)
      .sort((a, b) => a - b)
      .join(",");
    const esperadas = [...cambio.etiquetaIds]
      .sort((a, b) => a - b)
      .join(",");
    if (actuales !== esperadas) return false;
  }
  return true;
}

export function buscarTarea(
  tareas: TareaConDetalle[],
  id: number,
): TareaBase | null {
  for (const tarea of tareas) {
    if (tarea.id === id) return tarea;
    const subtarea = tarea.subtareas.find((item) => item.id === id);
    if (subtarea) return subtarea;
  }
  return null;
}

/** Mismo criterio que `alternarCompletada` en el servidor. */
export function destinoAlAlternar(
  estados: EstadoProyecto[],
  tarea: TareaBase,
) {
  if (tarea.estado.categoria === "completado") {
    return destinoAlReabrir(estados);
  }
  return estadoCompletado(estados) ?? null;
}

/** Estado al que vuelve una tarea al reabrirla (deshacer). */
export function destinoAlReabrir(estados: EstadoProyecto[]) {
  return (
    estadoParaCategoria(estados, "pendiente") ??
    estadoParaCategoria(estados, "en_progreso") ??
    null
  );
}
