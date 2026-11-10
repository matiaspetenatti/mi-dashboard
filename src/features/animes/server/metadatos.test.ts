import { describe, expect, it } from "vitest"

import {
  extraerEpisodiosJustWatch,
  extraerEstudioKitsu,
  extraerMetadatosAniList,
  normalizarEstudio,
  slugJustWatch,
} from "./metadatos"

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

describe("extraerMetadatosAniList", () => {
  const payload = {
    data: {
      Page: {
        media: [
          {
            seasonYear: 2021,
            episodes: 11,
            title: { english: "Mushoku Tensei: Jobless Reincarnation Part 2" },
            studios: {
              edges: [
                { isMain: false, node: { name: "Toho" } },
                { isMain: true, node: { name: "Studio Bind" } },
              ],
            },
          },
          {
            seasonYear: 2026,
            episodes: 12,
            title: { english: "Tokyo Revengers: War of the Three Titans Arc" },
            studios: {
              edges: [{ isMain: true, node: { name: "LIDENFILMS" } }],
            },
          },
        ],
      },
    },
  }

  it("prefiere el resultado del año pedido", () => {
    expect(extraerMetadatosAniList(payload, 2026)).toEqual({
      estudio: "LIDENFILMS",
      episodios: 12,
      tituloIngles: "Tokyo Revengers: War of the Three Titans Arc",
    })
  })

  it("usa el primer resultado si el año no coincide", () => {
    expect(extraerMetadatosAniList(payload, 1999)).toEqual({
      estudio: "Studio Bind",
      episodios: 11,
      tituloIngles: "Mushoku Tensei: Jobless Reincarnation Part 2",
    })
    expect(extraerMetadatosAniList(payload)).toEqual({
      estudio: "Studio Bind",
      episodios: 11,
      tituloIngles: "Mushoku Tensei: Jobless Reincarnation Part 2",
    })
  })

  it("toma el estudio principal y la cantidad de episodios", () => {
    const unico = {
      data: {
        Page: {
          media: [
            {
              seasonYear: 2024,
              episodes: 24,
              title: { english: "Chainsaw Man" },
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

    expect(extraerMetadatosAniList(unico, 2024)).toEqual({
      estudio: "MAPPA",
      episodios: 24,
      tituloIngles: "Chainsaw Man",
    })
  })

  it("devuelve null sin resultados", () => {
    expect(extraerMetadatosAniList(null)).toEqual({
      estudio: null,
      episodios: null,
      tituloIngles: null,
    })
    expect(
      extraerMetadatosAniList({ data: { Page: { media: [] } } }),
    ).toEqual({ estudio: null, episodios: null, tituloIngles: null })
    expect(
      extraerMetadatosAniList({
        data: { Page: { media: [{ studios: null }] } },
      }),
    ).toEqual({ estudio: null, episodios: null, tituloIngles: null })
  })

  it("ignora episodios desconocidos o inválidos", () => {
    expect(
      extraerMetadatosAniList({
        data: {
          Page: {
            media: [
              { seasonYear: 2026, episodes: null, studios: { edges: [] } },
              { seasonYear: 2025, episodes: 0, studios: { edges: [] } },
            ],
          },
        },
      }),
    ).toEqual({ estudio: null, episodios: null, tituloIngles: null })
  })
})

describe("slugJustWatch", () => {
  it("genera slugs parecidos a los de JustWatch", () => {
    expect(
      slugJustWatch(
        "The Laid-Off Cheat-Granting Mage Enjoys a Second Lease on Life",
      ),
    ).toBe("the-laid-off-cheat-granting-mage-enjoys-a-second-lease-on-life")

    expect(
      slugJustWatch("So What's Wrong with Getting Reborn as a Goblin?"),
    ).toBe("so-whats-wrong-with-getting-reborn-as-a-goblin")

    expect(slugJustWatch("Fate & Order: Café")).toBe("fate-and-order-cafe")
  })
})

describe("extraerEpisodiosJustWatch", () => {
  it("lee la cantidad de episodios de la tarjeta de temporada", () => {
    const html =
      '<div class="season-info"><div class="season-info__text episodes-number" data-v-x>12 Episodes</div></div>'

    expect(extraerEpisodiosJustWatch(html)).toBe(12)
  })

  it("devuelve null cuando no hay datos", () => {
    expect(extraerEpisodiosJustWatch("<div>Sin episodios</div>")).toBeNull()
  })
})
