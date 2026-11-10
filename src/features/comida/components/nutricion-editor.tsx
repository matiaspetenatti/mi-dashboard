"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  CAMPOS_NUTRICION,
  type CampoNutricion,
  type NutricionForm,
} from "@/features/comida/lib/nutricion"

export function NutricionEditor({
  idPrefix,
  activa,
  onActivaChange,
  valores,
  onChange,
  descripcion = "Valores aproximados por porción.",
}: {
  idPrefix: string
  activa: boolean
  onActivaChange: (activa: boolean) => void
  valores: NutricionForm
  onChange: (campo: CampoNutricion, valor: string) => void
  descripcion?: string
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-outline-variant/50 bg-surface-container-low/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Datos nutricionales
          </h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {descripcion}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`${idPrefix}-nutricion`}
            checked={activa}
            onCheckedChange={onActivaChange}
          />
          <Label htmlFor={`${idPrefix}-nutricion`} className="text-[10px]">
            {activa ? "Cargados" : "Sin datos"}
          </Label>
        </div>
      </div>

      {activa ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {CAMPOS_NUTRICION.map((campo) => (
            <div key={campo.key} className="space-y-1">
              <Label
                htmlFor={`${idPrefix}-${campo.key}`}
                className="text-[9px]"
              >
                {campo.label} ({campo.unidad})
              </Label>
              <Input
                id={`${idPrefix}-${campo.key}`}
                type="number"
                inputMode="decimal"
                min={0}
                max={campo.max}
                step="any"
                value={valores[campo.key]}
                onChange={(event) => onChange(campo.key, event.target.value)}
                placeholder="0"
                className="h-9"
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
