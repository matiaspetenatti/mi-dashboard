"use client";

import { useState } from "react";
import type { UnidadRecurrencia } from "./constantes";

const input = "rounded-md border px-3 py-2 text-sm";

type Props = { unidad?: UnidadRecurrencia | null; cada?: number | null };

export function SelectorRecurrencia({ unidad, cada }: Props) {
    const [modo, setModo] = useState<string>(!unidad ? "" : (cada ?? 1) === 1 ? unidad : "custom");
    const [customCada, setCustomCada] = useState(String(cada && cada > 1 ? cada : 2));
    const [customUnidad, setCustomUnidad] = useState<UnidadRecurrencia>(unidad ?? "dia");

    const unidadFinal = modo === "" ? "" : modo === "custom" ? customUnidad : modo;
    const cadaFinal = modo === "custom" ? customCada : "1";

    return (
        <div className="flex flex-wrap items-center gap-2">
            <select value={modo} onChange={(e) => setModo(e.target.value)} className={input}>
                <option value="">No se repite</option>
                <option value="dia">Todos los días</option>
                <option value="semana">Cada semana</option>
                <option value="mes">Cada mes</option>
                <option value="anio">Cada año</option>
                <option value="custom">Personalizado…</option>
            </select>

            {modo === "custom" && (
                <>
                    <span className="text-sm text-neutral-500">Cada</span>
                    <input
                        type="number"
                        min={1}
                        max={365}
                        value={customCada}
                        onChange={(e) => setCustomCada(e.target.value)}
                        className={`${input} w-20`}
                    />
                    <select
                        value={customUnidad}
                        onChange={(e) => setCustomUnidad(e.target.value as UnidadRecurrencia)}
                        className={input}
                    >
                        <option value="dia">días</option>
                        <option value="semana">semanas</option>
                        <option value="mes">meses</option>
                        <option value="anio">años</option>
                    </select>
                </>
            )}

            <input type="hidden" name="recurrenciaUnidad" value={unidadFinal} />
            <input type="hidden" name="recurrenciaCada" value={cadaFinal} />
        </div>
    );
}