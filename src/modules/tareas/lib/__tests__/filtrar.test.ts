import { describe, it, expect } from "vitest";
import { filtrarTareas, agruparTareas } from "../filtrar";
import { configVistaBase } from "../config-vista";

describe("filtrarTareas", () => {
  it("filtra por busqueda", () => {
    const tareas = [
      { id: 1, titulo: "Comprar leche", estado: { categoria: "pendiente" }, estadoId: 1, proyectoId: 1, proyecto: { id: 1, nombre: "P", color: "#000", prefijo: "P" }, etiquetas: [], prioridad: null, fechaLimite: null, descripcion: null, posicion: 0, parentId: null, fechaInicio: null, completadaEn: null, recurrencia: null, recurrenciaCada: 1, creadaEn: "", actualizadaEn: null, subtareas: [], subtareasCompletadas: 0, destacada: false, archivadaEn: null, estimacionMinutos: null, tiempoRegistradoSegundos: 0, color: null, recurrenciaDiasSemana: null, recurrenciaFin: null, recurrenciaSaltada: null, asignadoA: null },
      { id: 2, titulo: "Estudiar", estado: { categoria: "pendiente" }, estadoId: 1, proyectoId: 1, proyecto: { id: 1, nombre: "P", color: "#000", prefijo: "P" }, etiquetas: [], prioridad: null, fechaLimite: null, descripcion: null, posicion: 0, parentId: null, fechaInicio: null, completadaEn: null, recurrencia: null, recurrenciaCada: 1, creadaEn: "", actualizadaEn: null, subtareas: [], subtareasCompletadas: 0, destacada: false, archivadaEn: null, estimacionMinutos: null, tiempoRegistradoSegundos: 0, color: null, recurrenciaDiasSemana: null, recurrenciaFin: null, recurrenciaSaltada: null, asignadoA: null },
    ] as unknown as Parameters<typeof filtrarTareas>[0];
    const config = { ...configVistaBase, filtros: { ...configVistaBase.filtros, busqueda: "leche" } };
    const res = filtrarTareas(tareas, config, "2026-01-01");
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe(1);
  });
});