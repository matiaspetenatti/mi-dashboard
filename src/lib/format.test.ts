import { describe, expect, it } from "vitest"

import { formatMonto, formatMontoCompacto } from "./format"

describe("formato de moneda", () => {
  it("formatea centavos como pesos argentinos", () => {
    expect(formatMonto(150050)).toContain("1.500,50")
    expect(formatMonto(0)).toContain("0,00")
  })

  it("compacta montos grandes", () => {
    expect(formatMontoCompacto(1_500_000)).toContain("1,5M")
    expect(formatMontoCompacto(2_500)).toContain("2,5k")
  })
})
