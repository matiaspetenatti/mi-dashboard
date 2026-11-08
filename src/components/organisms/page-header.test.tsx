import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PageHeader } from "./page-header"

describe("PageHeader", () => {
  it("renderiza título, descripción y fecha", () => {
    render(
      <PageHeader
        eyebrow="Tu espacio personal"
        title="Buen día"
        description="Un vistazo rápido"
        meta="Domingo, 8 de noviembre"
      />,
    )

    expect(screen.getByRole("heading", { name: "Buen día" })).toBeInTheDocument()
    expect(screen.getByText("Un vistazo rápido")).toBeInTheDocument()
    expect(screen.getByText("Domingo, 8 de noviembre")).toBeInTheDocument()
  })
})
