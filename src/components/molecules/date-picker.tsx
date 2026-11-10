"use client"

import { useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "cn"

function fechaDesdeValor(valor: string): Date | undefined {
  if (!valor) return undefined
  const fecha = parseISO(valor)
  return isValid(fecha) ? fecha : undefined
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Elegir fecha",
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
  const fecha = fechaDesdeValor(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 w-full justify-start rounded-xl border-outline-variant/70 bg-card px-3 text-left text-sm font-normal",
          !fecha && "text-muted-foreground",
          className,
        )}
      >
        <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {fecha
            ? format(fecha, "d MMM yyyy", { locale: es })
            : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={fecha}
          defaultMonth={fecha}
          locale={es}
          autoFocus
          onSelect={(seleccionada) => {
            onChange(seleccionada ? format(seleccionada, "yyyy-MM-dd") : "")
            setOpen(false)
          }}
        />
        {clearable && fecha ? (
          <div className="border-t border-outline-variant/50 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full rounded-full text-[10px] font-bold"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Limpiar fecha
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
