import { describe, expect, it } from "vitest"

import {
  extraerEstudioAniList,
  extraerEstudioKitsu,
  normalizarEstudio,
} from "./estudios"

describe("normalizarEstudio", () => {
  it("unifica alias conocidos", () => {
    expect(normalizarEstudio("Pierrot")).toBe("Studio Pierrot")
    expect(normalizarEstudio(" Studio Pierrot ")).toBe("Studio Pierrot")
    expect(normalizarEstudio("8bit")).toBe("8-bit")
    expect(normalizarEstudio("8-BIT")).toBe("8-bit")
  })

  it("devuelve null para nombres vacíos", () => {
    expect(normalizarEstudio(null)).toBeNull()
    expect(normalizarEstudio("   ")).toBeNull()
  })
})

describe("extraerEstudioKitsu", () => {
  it("toma el productor con rol studio", () => {
    const payload = {
      data: [
        {
          attributes: { role: "producer" },
          relationships: { producer: { data: { id: "1" } } },
        },
        {
          attributes: { role: "studio" },
          relationships: { producer: { data: { id: "2" } } },
        },
        {
          attributes: { role: "licensor" },
          relationships: { producer: { data: { id: "3" } } },
        },
      ],
      included: [
        { id: "1", type: "producers", attributes: { name: "Dentsu" } },
        { id: "2", type: "producers", attributes: { name: "Wit Studio" } },
        { id: "3", type: "producers", attributes: { name: "Funimation" } },
      ],
    }

    expect(extraerEstudioKitsu(payload)).toBe("Wit Studio")
  })

  it("no distingue mayúsculas en el rol", () => {
    const payload = {
      data: [
        {
          attributes: { role: "STUDIO" },
          relationships: { producer: { data: { id: "9" } } },
        },
      ],
      included: [
        { id: "9", type: "producers", attributes: { name: " MAPPA " } },
      ],
    }

    expect(extraerEstudioKitsu(payload)).toBe("MAPPA")
  })

  it("ignora roles que no son studio", () => {
    const payload = {
      data: [
        {
          attributes: { role: "producer" },
          relationships: { producer: { data: { id: "1" } } },
        },
      ],
      included: [
        { id: "1", type: "producers", attributes: { name: "Dentsu" } },
      ],
    }

    expect(extraerEstudioKitsu(payload)).toBeNull()
  })

  it("devuelve null si falta el productor o el nombre", () => {
    expect(
      extraerEstudioKitsu({
        data: [{ attributes: { role: "studio" } }],
        included: [],
      }),
    ).toBeNull()

    expect(
      extraerEstudioKitsu({
        data: [
          {
            attributes: { role: "studio" },
            relationships: { producer: { data: { id: "5" } } },
          },
        ],
        included: [{ id: "5", type: "producers", attributes: {} }],
      }),
    ).toBeNull()

    expect(extraerEstudioKitsu(null)).toBeNull()
  })
})

describe("extraerEstudioAniList", () => {
  const payload = {
    data: {
      Page: {
        media: [
          {
            seasonYear: 2021,
            studios: {
              edges: [
                { isMain: false, node: { name: "Toho" } },
                { isMain: true, node: { name: "Studio Bind" } },
              ],
            },
          },
          {
            seasonYear: 2026,
            studios: {
              edges: [{ isMain: true, node: { name: "LIDENFILMS" } }],
            },
          },
        ],
      },
    },
  }

  it("prefiere el resultado del año pedido", () => {
    expect(extraerEstudioAniList(payload, 2026)).toBe("LIDENFILMS")
  })

  it("usa el primer resultado si el año no coincide", () => {
    expect(extraerEstudioAniList(payload, 1999)).toBe("Studio Bind")
    expect(extraerEstudioAniList(payload)).toBe("Studio Bind")
  })

  it("toma el estudio principal", () => {
    const unico = {
      data: {
        Page: {
          media: [
            {
              seasonYear: 2024,
              studios: {
                edges: [
                  { isMain: false, node: { name: "Toho" } },
                  { isMain: true, node: { name: "MAPPA" } },
                ],
              },
            },
          ],
        },
      },
    }

    expect(extraerEstudioAniList(unico, 2024)).toBe("MAPPA")
  })

  it("devuelve null sin resultados", () => {
    expect(extraerEstudioAniList(null)).toBeNull()
    expect(extraerEstudioAniList({ data: { Page: { media: [] } } })).toBeNull()
    expect(
      extraerEstudioAniList({ data: { Page: { media: [{ studios: null }] } } }),
    ).toBeNull()
  })
})
