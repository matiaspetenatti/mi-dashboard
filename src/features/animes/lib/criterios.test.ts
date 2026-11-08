import { describe, expect, it } from "vitest"

import {
  aColumnasPuntaje,
  calcularTotalPuntajes,
  crearPuntajesVacios,
  extraerPuntajes,
  puntajeMostrable,
} from "./criterios"
import type { AnimeVisto } from "@/server/db/schema"

function anime(overrides: Partial<AnimeVisto> = {}): AnimeVisto {
  return {
    id: 1,
    kitsuId: 1,
    titulo: "Anime",
    tituloIngles: null,
    imagen: "https://example.com/anime.jpg",
    tipo: "TV",
    episodios: 12,
    ano: 2024,
    fechaEmision: "2024-01-01",
    generos: [],
    descripcion: null,
    scoreMal: 8,
    miPuntaje: null,
    puntajePremisa: null,
    puntajeRitmo: null,
    puntajeProtagonista: null,
    puntajeElenco: null,
    puntajeAnimacion: null,
    puntajeDireccion: null,
    puntajeBandaSonora: null,
    puntajeOpenings: null,
    puntajeFinal: null,
    puntajeRevisitabilidad: null,
    episodiosVistos: 0,
    estado: "completado",
    rewatch: false,
    favorito: false,
    anilistId: null,
    estudio: null,
    fuente: null,
    formato: null,
    tags: [],
    notas: null,
    agregadoEn: "2026-01-01 00:00:00",
    actualizadoEn: null,
    ...overrides,
  }
}

describe("calcularTotalPuntajes", () => {
  it("suma solo los criterios calificados", () => {
    expect(
      calcularTotalPuntajes({
        premisa: 8,
        ritmo: 7,
        animacion: 9,
      }),
    ).toBe(24)
  })

  it("devuelve null sin criterios", () => {
    expect(calcularTotalPuntajes(crearPuntajesVacios())).toBeNull()
  })
})

describe("puntajeMostrable", () => {
  it("prioriza la suma de criterios", () => {
    expect(
      puntajeMostrable(
        anime({ miPuntaje: 50, puntajePremisa: 10, puntajeRitmo: 9 }),
      ),
    ).toBe(19)
  })

  it("usa el total guardado para animes sin desglose", () => {
    expect(puntajeMostrable(anime({ miPuntaje: 82 }))).toBe(82)
  })

  it("devuelve null cuando no hay puntaje", () => {
    expect(puntajeMostrable(anime({ miPuntaje: 0 }))).toBeNull()
  })
})

describe("conversión de puntajes", () => {
  it("extrae y vuelve a armar las columnas sin perder datos", () => {
    const original = anime({
      puntajePremisa: 8,
      puntajeRitmo: 7,
      puntajeProtagonista: 6,
      puntajeElenco: 5,
      puntajeAnimacion: 9,
      puntajeDireccion: 8,
      puntajeBandaSonora: 7,
      puntajeOpenings: 6,
      puntajeFinal: 5,
      puntajeRevisitabilidad: 4,
    })

    const puntajes = extraerPuntajes(original)
    expect(puntajes.premisa).toBe(8)
    expect(calcularTotalPuntajes(puntajes)).toBe(65)
    expect(aColumnasPuntaje(puntajes)).toEqual({
      puntajePremisa: 8,
      puntajeRitmo: 7,
      puntajeProtagonista: 6,
      puntajeElenco: 5,
      puntajeAnimacion: 9,
      puntajeDireccion: 8,
      puntajeBandaSonora: 7,
      puntajeOpenings: 6,
      puntajeFinal: 5,
      puntajeRevisitabilidad: 4,
    })
  })
})
