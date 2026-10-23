import { db } from "@/db";
import { categoriasFinanzas } from "@/modules/finanzas/schema";
import { eq } from "drizzle-orm";

async function main() {
  const existentes = await db.select().from(categoriasFinanzas).limit(1);
  if (existentes.length > 0) {
    console.log("Ya existen categorías configuradas");
    return;
  }

  const padres = await db
    .insert(categoriasFinanzas)
    .values([
      { nombre: "Comida", tipo: "gasto", icono: "UtensilsCrossed", orden: 1, esSistema: true },
      { nombre: "Transporte", tipo: "gasto", icono: "Car", orden: 2, esSistema: true },
      { nombre: "Servicios", tipo: "gasto", icono: "Zap", orden: 3, esSistema: true },
      { nombre: "Ocio", tipo: "gasto", icono: "Gamepad2", orden: 4, esSistema: true },
      { nombre: "Salud", tipo: "gasto", icono: "HeartPulse", orden: 5, esSistema: true },
      { nombre: "Estudio", tipo: "gasto", icono: "GraduationCap", orden: 6, esSistema: true },
      { nombre: "Sueldo", tipo: "ingreso", icono: "Briefcase", orden: 7, esSistema: true },
      { nombre: "Rendimientos", tipo: "ingreso", icono: "TrendingUp", orden: 8, esSistema: true },
      { nombre: "Transferencia", tipo: "gasto", icono: "ArrowRightLeft", orden: 9, esSistema: true },
      { nombre: "Ajuste", tipo: "gasto", icono: "Wrench", orden: 10, esSistema: true },
      { nombre: "Otros", tipo: "gasto", icono: "Tag", orden: 11, esSistema: true },
    ])
    .returning();

  const servicios = padres.find((p) => p.nombre === "Servicios");
  if (servicios) {
    await db.insert(categoriasFinanzas).values([
      { nombre: "Agua", tipo: "gasto", icono: "Droplet", parentId: servicios.id, orden: 1, esSistema: true },
      { nombre: "Luz", tipo: "gasto", icono: "Lightbulb", parentId: servicios.id, orden: 2, esSistema: true },
      { nombre: "Gas", tipo: "gasto", icono: "Flame", parentId: servicios.id, orden: 3, esSistema: true },
      { nombre: "Internet", tipo: "gasto", icono: "Wifi", parentId: servicios.id, orden: 4, esSistema: true },
      { nombre: "Teléfono", tipo: "gasto", icono: "Phone", parentId: servicios.id, orden: 5, esSistema: true },
      { nombre: "Municipalidad", tipo: "gasto", icono: "Building2", parentId: servicios.id, orden: 6, esSistema: true },
      { nombre: "EMOS", tipo: "gasto", icono: "Wrench", parentId: servicios.id, orden: 7, esSistema: true },
      { nombre: "EPEC", tipo: "gasto", icono: "Zap", parentId: servicios.id, orden: 8, esSistema: true },
      { nombre: "Ecogas", tipo: "gasto", icono: "Flame", parentId: servicios.id, orden: 9, esSistema: true },
    ]);
  }

  console.log("Categorías sembradas");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
