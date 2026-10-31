export const HABITOS_TAG = "habitos";
export const GITHUB_TAG = "github-actividad";
export const GITHUB_USUARIO = "matiaspetenatti";
export const GITHUB_CACHE_HORAS = 24;

export const TIPOS_HABITO: Array<{
  valor: "bueno" | "malo";
  etiqueta: string;
  descripcion: string;
  color: string;
}> = [
  {
    valor: "bueno",
    etiqueta: "Hábito bueno",
    descripcion: "Hábitos que querés construir y mantener",
    color: "bg-success-container text-on-success-container",
  },
  {
    valor: "malo",
    etiqueta: "Hábito malo",
    descripcion: "Hábitos que querés erradicar o reducir",
    color: "bg-error-container text-on-error-container",
  },
];

export const COLORES_HABITO: Array<{ valor: string; etiqueta: string }> = [
  { valor: "#163300", etiqueta: "Forest Ink" },
  { valor: "#054d28", etiqueta: "Spruce" },
  { valor: "#0b4c72", etiqueta: "Signal Blue" },
  { valor: "#cb272f", etiqueta: "Alarm Red" },
  { valor: "#6a6c6a", etiqueta: "Slate" },
];

export const DIAS_SEMANA = [
  { clave: "lun", etiqueta: "Lun" },
  { clave: "mar", etiqueta: "Mar" },
  { clave: "mie", etiqueta: "Mié" },
  { clave: "jue", etiqueta: "Jue" },
  { clave: "vie", etiqueta: "Vie" },
  { clave: "sab", etiqueta: "Sáb" },
  { clave: "dom", etiqueta: "Dom" },
];

export function tipoLabel(tipo: "bueno" | "malo") {
  return TIPOS_HABITO.find((t) => t.valor === tipo)?.etiqueta || tipo;
}

export function tipoColor(tipo: "bueno" | "malo") {
  return TIPOS_HABITO.find((t) => t.valor === tipo)?.color || "";
}
