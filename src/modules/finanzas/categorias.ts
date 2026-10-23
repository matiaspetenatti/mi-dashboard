export const categorias = [
  "Comida",
  "Transporte",
  "Servicios",
  "Ocio",
  "Salud",
  "Estudio",
  "Sueldo",
  "Rendimientos",
  "Transferencia",
  "Ajuste",
  "Otros",
] as const;

export type Categoria = (typeof categorias)[number];
