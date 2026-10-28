import type { EstadoProyecto, Etiqueta, Prioridad } from "@/modules/tareas/schema";
import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import { ordenPrioridad, etiquetasPrioridad } from "@/modules/tareas/constantes";
import type { ConfigVista } from "./config-vista";

export type GrupoTareas = {
  clave: string;
  titulo: string;
  color: string | null;
  estado: EstadoProyecto | null;
  etiqueta: Etiqueta | null;
  prioridad: Prioridad | null;
  tareas: TareaConDetalle[];
};

function finDeSemana(hoy: string) {
  return new Date(Date.parse(`${hoy}T00:00:00Z`) + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export function coincideBusqueda(tarea: TareaConDetalle, busqueda: string) {
  const texto = busqueda.trim().toLowerCase();
  if (!texto) return true;
  return (
    tarea.titulo.toLowerCase().includes(texto) ||
    (tarea.descripcion?.toLowerCase().includes(texto) ?? false) ||
    tarea.etiquetas.some((etiqueta) => etiqueta.nombre.includes(texto))
  );
}

export function filtrarTareas(
  tareas: TareaConDetalle[],
  config: ConfigVista,
  hoy: string,
) {
  const { filtros } = config;
  const limite = finDeSemana(hoy);

  return tareas.filter((tarea) => {
    if (
      !config.mostrarCompletadas &&
      (tarea.estado.categoria === "completado" ||
        tarea.estado.categoria === "cancelado")
    ) {
      return false;
    }

    if (filtros.estados.length > 0 && !filtros.estados.includes(tarea.estadoId)) {
      return false;
    }

    if (
      filtros.prioridades.length > 0 &&
      (!tarea.prioridad || !filtros.prioridades.includes(tarea.prioridad))
    ) {
      return false;
    }

    if (
      filtros.etiquetas.length > 0 &&
      !tarea.etiquetas.some((etiqueta) => filtros.etiquetas.includes(etiqueta.id))
    ) {
      return false;
    }

    if (filtros.vencimiento === "vencidas") {
      if (!tarea.fechaLimite || tarea.fechaLimite >= hoy) return false;
    }
    if (filtros.vencimiento === "hoy" && tarea.fechaLimite !== hoy) {
      return false;
    }
    if (
      filtros.vencimiento === "semana" &&
      (!tarea.fechaLimite ||
        tarea.fechaLimite < hoy ||
        tarea.fechaLimite > limite)
    ) {
      return false;
    }
    if (filtros.vencimiento === "sin_fecha" && tarea.fechaLimite) {
      return false;
    }

    return coincideBusqueda(tarea, filtros.busqueda);
  });
}

export function ordenarTareas(
  tareas: TareaConDetalle[],
  config: ConfigVista,
) {
  const sentido = config.sentido === "desc" ? -1 : 1;
  const vacias = (valor: string | null) => (valor ? 0 : 1);

  return [...tareas].sort((a, b) => {
    switch (config.orden) {
      case "fechaLimite": {
        const comparacion =
          vacias(a.fechaLimite) - vacias(b.fechaLimite) ||
          (a.fechaLimite ?? "").localeCompare(b.fechaLimite ?? "");
        return comparacion * sentido || a.id - b.id;
      }
      case "completada": {
        const comparacion = (a.completadaEn ?? "").localeCompare(
          b.completadaEn ?? "",
        );
        return comparacion * sentido || a.id - b.id;
      }
      case "prioridad": {
        const valorA = a.prioridad ? ordenPrioridad[a.prioridad] : 4;
        const valorB = b.prioridad ? ordenPrioridad[b.prioridad] : 4;
        return (valorA - valorB) * sentido || a.id - b.id;
      }
      case "creado":
        return (a.id - b.id) * sentido;
      case "titulo":
        return (a.titulo.localeCompare(b.titulo, "es") || a.id - b.id) * sentido;
      default:
        return (
          a.posicion - b.posicion ||
          a.id - b.id
        ) * sentido;
    }
  });
}

export function agruparTareas(
  tareas: TareaConDetalle[],
  config: ConfigVista,
  estados: EstadoProyecto[],
  etiquetas: Etiqueta[],
): GrupoTareas[] {
  if (config.agruparPor === "ninguna") {
    return [
      {
        clave: "todas",
        titulo: "Todas las tareas",
        color: null,
        estado: null,
        etiqueta: null,
        prioridad: null,
        tareas,
      },
    ];
  }

  if (config.agruparPor === "estado") {
    return estados
      .map((estado) => ({
        clave: `estado-${estado.id}`,
        titulo: estado.nombre,
        color: estado.color,
        estado,
        etiqueta: null,
        prioridad: null,
        tareas: tareas.filter((tarea) => tarea.estadoId === estado.id),
      }))
      .filter((grupo) => grupo.tareas.length > 0);
  }

  if (config.agruparPor === "prioridad") {
    const orden: Prioridad[] = ["urgente", "alta", "media", "baja"];
    const grupos: GrupoTareas[] = orden.map((prioridad) => ({
      clave: `prioridad-${prioridad}`,
      titulo: etiquetasPrioridad[prioridad],
      color: null,
      estado: null,
      etiqueta: null,
      prioridad,
      tareas: tareas.filter((tarea) => tarea.prioridad === prioridad),
    }));
    grupos.push({
      clave: "prioridad-sin",
      titulo: "Sin prioridad",
      color: null,
      estado: null,
      etiqueta: null,
      prioridad: null,
      tareas: tareas.filter((tarea) => !tarea.prioridad),
    });
    return grupos.filter((grupo) => grupo.tareas.length > 0);
  }

  if (config.agruparPor === "proyecto") {
    const grupos: GrupoTareas[] = [];
    const vistos = new Set<number>();
    for (const tarea of tareas) {
      if (vistos.has(tarea.proyectoId)) continue;
      vistos.add(tarea.proyectoId);
      grupos.push({
        clave: `proyecto-${tarea.proyectoId}`,
        titulo: tarea.proyecto.nombre,
        color: tarea.proyecto.color,
        estado: null,
        etiqueta: null,
        prioridad: null,
        tareas: tareas.filter(
          (propia) => propia.proyectoId === tarea.proyectoId,
        ),
      });
    }
    return grupos;
  }

  const grupos: GrupoTareas[] = etiquetas
    .map((etiqueta) => ({
      clave: `etiqueta-${etiqueta.id}`,
      titulo: etiqueta.nombre,
      color: etiqueta.color,
      estado: null,
      etiqueta,
      prioridad: null,
      tareas: tareas.filter((tarea) =>
        tarea.etiquetas.some((propia) => propia.id === etiqueta.id),
      ),
    }))
    .filter((grupo) => grupo.tareas.length > 0);

  const sinEtiqueta = tareas.filter((tarea) => tarea.etiquetas.length === 0);
  if (sinEtiqueta.length > 0) {
    grupos.push({
      clave: "etiqueta-sin",
      titulo: "Sin etiquetas",
      color: null,
      estado: null,
      etiqueta: null,
      prioridad: null,
      tareas: sinEtiqueta,
    });
  }
  return grupos;
}

export function contarFiltros(config: ConfigVista) {
  const { filtros } = config;
  return (
    filtros.estados.length +
    filtros.prioridades.length +
    filtros.etiquetas.length +
    (filtros.vencimiento ? 1 : 0) +
    (filtros.busqueda.trim() ? 1 : 0) +
    (config.mostrarCompletadas ? 0 : 0)
  );
}
