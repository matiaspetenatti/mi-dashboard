export type ResultadoAccion<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export function errorAccion(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
