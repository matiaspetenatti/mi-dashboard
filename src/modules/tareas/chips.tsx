import { iconos } from "./iconos";
import type { GrupoData, TagData } from "./constantes";

export function TagChip({ tag, className = "" }: { tag: TagData; className?: string }) {
    const Icono = tag.icono && tag.icono in iconos ? iconos[tag.icono as keyof typeof iconos] : null;
    return (
        <span
            style={{
                backgroundColor: `color-mix(in oklab, ${tag.color} 15%, white)`,
                color: `color-mix(in oklab, ${tag.color} 70%, black)`,
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${className}`}
        >
            {Icono && <Icono size={12} />}
            {tag.nombre}
        </span>
    );
}

export function GrupoBadge({ grupo }: { grupo: Pick<GrupoData, "nombre" | "color"> }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs text-neutral-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: grupo.color }} />
            {grupo.nombre}
        </span>
    );
}