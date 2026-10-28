export {
  getEtiquetas,
  getEtiquetasConUso,
} from "./etiquetas";
export {
  getTareasProyecto,
  getTareasGlobales,
  getResumenGlobal,
  getPendientesCount,
  getProximasTareas,
  getConteoPendientePorProyecto,
  esPendiente,
  type TareaBase,
  type TareaConDetalle,
  type ResumenGlobal,
} from "./tareas";
export {
  getProyectosConResumen,
  getProyectoWorkspace,
  getProyectoPorSlug,
  type ResumenProyecto,
  type ResumenPorEstado,
  type ProyectoWorkspace,
  type VistaConConfig,
} from "./proyectos";
export { getVistasProyecto } from "./vistas";
