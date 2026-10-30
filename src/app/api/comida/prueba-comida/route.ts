import { NextResponse } from "next/server";
import { generarMenu, generarReceta } from "@/modules/comida/lib/ia";
import { getComida } from "@/modules/comida/queries";
import { inicioSemana } from "@/modules/comida/lib/semana";

export async function GET() {
  const inicio = Date.now();

  const disponibles = [
    { nombre: "Pollo", cantidad: 1, unidad: "kg" },
    { nombre: "Arroz", cantidad: 500, unidad: "g" },
    { nombre: "Cebolla", cantidad: 3, unidad: "unidad" },
    { nombre: "Morrón", cantidad: 2, unidad: "unidad" },
    { nombre: "Tomate", cantidad: 4, unidad: "unidad" },
  ];

  const [receta, menu, data] = await Promise.all([
    generarReceta({
      modo: "cocina",
      tipo: "cena",
      tono: "rapido",
      minutos: 30,
      porciones: 2,
      disponibles,
      utensilios: [],
      permitirExtras: true,
      sorprender: false,
      evitar: [],
      nota: "sin horno",
    }),
    generarMenu({
      dias: ["2026-11-02", "2026-11-03"],
      momentos: ["almuerzo", "cena"],
      disponibles,
      recetas: [],
      yaPlanificado: [],
    }),
    getComida(inicioSemana()),
  ]);

  return NextResponse.json({
    ms: Date.now() - inicio,
    receta,
    menu,
    resumen: {
      semana: data.semana,
      hoy: data.hoy,
      items: data.items.length,
      recetas: data.recetas.length,
      menu: data.menu.length,
      lista: data.lista.length,
      kpis: data.kpis,
    },
  });
}
