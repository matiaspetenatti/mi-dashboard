import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"

describe("Button", () => {
  it("usa el acento lima en la acción primaria", () => {
    render(<Button>Crear tarea</Button>)
    expect(screen.getByRole("button", { name: "Crear tarea" })).toHaveClass(
      "bg-lime-voltage",
    )
  })

  it("permite la variante outline", () => {
    render(<Button variant="outline">Cancelar</Button>)
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveClass(
      "border-border",
    )
  })
})
