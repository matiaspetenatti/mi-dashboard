export type ResultadoAccion =
  | { ok: true; id?: number; agregados?: number }
  | { ok: false; error: string };

export function texto(formData: FormData, clave: string) {
  const valor = formData.get(clave);
  return typeof valor === "string" ? valor.trim() : "";
}

export function opcional(formData: FormData, clave: string) {
  const valor = texto(formData, clave);
  return valor === "" ? null : valor;
}

export function numero(formData: FormData, clave: string) {
  const valor = texto(formData, clave).replace(",", ".");
  if (valor === "") return null;
  const parsed = Number(valor);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function enteroOpcional(formData: FormData, clave: string) {
  const valor = numero(formData, clave);
  if (valor === null) return null;
  return Number.isInteger(valor) ? valor : Number.NaN;
}

export function idValido(valor: number) {
  return Number.isInteger(valor) && valor > 0;
}

/** Primer mensaje de error de Zod, para devolver algo legible al cliente. */
export function primerError(error: {
  issues: Array<{ message: string }>;
}): string {
  return error.issues[0]?.message || "Datos inválidos";
}
