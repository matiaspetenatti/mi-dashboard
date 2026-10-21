import { iconos, iconoKeys } from "./iconos";
import { paleta } from "./constantes";

export function SelectorColor({ defaultValue }: { defaultValue?: string }) {
    return (
        <div className="flex flex-wrap gap-2">
            {paleta.map((c, i) => (
                <label key={c} className="cursor-pointer">
                    <input
                        type="radio"
                        name="color"
                        value={c}
                        defaultChecked={defaultValue ? c === defaultValue : i === 0}
                        className="peer sr-only"
                    />
                    <span
                        className="block h-6 w-6 rounded-full ring-neutral-900 ring-offset-2 peer-checked:ring-2 peer-focus-visible:ring-2"
                        style={{ backgroundColor: c }}
                    />
                </label>
            ))}
        </div>
    );
}

export function SelectorIcono({ defaultValue }: { defaultValue?: string | null }) {
    const caja =
        "flex h-8 w-8 items-center justify-center rounded-md border peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-400";
    return (
        <div className="flex flex-wrap gap-1.5">
            <label className="cursor-pointer" title="Sin ícono">
                <input type="radio" name="icono" value="" defaultChecked={!defaultValue} className="peer sr-only" />
                <span className={`${caja} text-xs text-neutral-400`}>—</span>
            </label>
            {iconoKeys.map((k) => {
                const Icono = iconos[k];
                return (
                    <label key={k} className="cursor-pointer" title={k}>
                        <input type="radio" name="icono" value={k} defaultChecked={defaultValue === k} className="peer sr-only" />
                        <span className={caja}>
                            <Icono size={16} />
                        </span>
                    </label>
                );
            })}
        </div>
    );
}