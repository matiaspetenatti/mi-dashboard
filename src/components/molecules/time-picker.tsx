"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "cn"

const HORAS = Array.from({ length: 24 }, (_, indice) =>
  String(indice).padStart(2, "0"),
)
const MINUTOS = Array.from({ length: 60 }, (_, indice) =>
  String(indice).padStart(2, "0"),
)

function partes(valor: string) {
  const [hora = "", minuto = ""] = valor.split(":")
  return {
    hora: /^\d{2}$/.test(hora) ? hora : "",
    minuto: /^\d{2}$/.test(minuto) ? minuto : "",
  }
}

function horaActual() {
  const ahora = new Date()
  return {
    hora: String(ahora.getHours()).padStart(2, "0"),
    minuto: String(ahora.getMinutes()).padStart(2, "0"),
  }
}

export function TimePicker({
  id,
  value,
  onChange,
  placeholder = "Elegir hora",
  clearable = false,
  className,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  clearable?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [hora, setHora] = useState("")
  const [minuto, setMinuto] = useState("")

  useEffect(() => {
    if (!open) return
    const actual = horaActual()
    const inicial = partes(value)
    setHora(inicial.hora || actual.hora)
    setMinuto(inicial.minuto || actual.minuto)
  }, [open, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 w-full justify-start rounded-xl border-outline-variant/70 bg-card px-3 text-left text-sm font-normal",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <Clock className="size-4 shrink-0" aria-hidden="true" />
        <span className="tabular truncate">{value || placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex items-center justify-between px-3 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Hora
          </p>
          <p className="tabular text-sm font-black text-heading">
            {hora || "--"}:{minuto || "--"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2">
          <div>
            <p className="px-1 pb-1 text-[9px] font-bold text-muted-foreground">
              Horas
            </p>
            <div className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto pr-1">
              {HORAS.map((opcion) => (
                <Button
                  key={opcion}
                  type="button"
                  size="sm"
                  variant={hora === opcion ? "default" : "ghost"}
                  className="h-6 rounded-full px-1 text-[9px] font-bold"
                  onClick={() => {
                    setHora(opcion)
                    setMinuto((actual) => actual || "00")
                    onChange(`${opcion}:${minuto || "00"}`)
                  }}
                >
                  {opcion}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="px-1 pb-1 text-[9px] font-bold text-muted-foreground">
              Minutos
            </p>
            <div className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto pr-1">
              {MINUTOS.map((opcion) => (
                <Button
                  key={opcion}
                  type="button"
                  size="sm"
                  variant={minuto === opcion ? "default" : "ghost"}
                  className="h-6 rounded-full px-1 text-[9px] font-bold"
                  onClick={() => {
                    setMinuto(opcion)
                    onChange(`${hora || horaActual().hora}:${opcion}`)
                    setOpen(false)
                  }}
                >
                  {opcion}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-outline-variant/50 p-2">
          {clearable && value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-[10px] font-bold"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Limpiar
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full text-[10px] font-bold"
            onClick={() => {
              const actual = horaActual()
              setHora(actual.hora)
              setMinuto(actual.minuto)
              onChange(`${actual.hora}:${actual.minuto}`)
              setOpen(false)
            }}
          >
            Ahora
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
