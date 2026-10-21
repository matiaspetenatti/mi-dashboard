export type FiltrosUrl = {
  vista?: string;
  tag?: string;
  grupo?: string;
  mes?: string;
};

export function hrefTareas(p: FiltrosUrl) {
  const q = new URLSearchParams();
  if (p.vista && p.vista !== "lista") q.set("vista", p.vista);
  if (p.tag) q.set("tag", p.tag);
  if (p.grupo) q.set("grupo", p.grupo);
  if (p.mes) q.set("mes", p.mes);
  const s = q.toString();
  return s ? `/tareas?${s}` : "/tareas";
}
