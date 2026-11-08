import "@tanstack/react-start/server-only"

import { getDb } from "@/server/db/client"
import { githubActividad } from "@/server/db/schema"
import { GITHUB_USUARIO } from "../constantes"

const ZONA_HORARIA = "America/Argentina/Cordoba"

function fechaLocal(valor: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(valor))
}

type EventoGithub = {
  type?: string
  created_at?: string
  payload?: {
    commits?: unknown[]
  }
}

export async function sincronizarGithubEnDb() {
  const respuesta = await fetch(
    `https://api.github.com/users/${GITHUB_USUARIO}/events?per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "mi-dashboard-habitos",
      },
      signal: AbortSignal.timeout(15_000),
    },
  )

  if (!respuesta.ok) {
    throw new Error(`GitHub respondió con estado ${respuesta.status}`)
  }

  const eventos = (await respuesta.json()) as EventoGithub[]
  const hace30Dias = Date.now() - 30 * 86_400_000
  const porFecha = new Map<
    string,
    { commits: number; pullRequests: number; issues: number }
  >()

  for (const evento of eventos) {
    if (!evento.created_at) continue
    const fechaEvento = Date.parse(evento.created_at)
    if (!Number.isFinite(fechaEvento) || fechaEvento < hace30Dias) continue

    const fecha = fechaLocal(evento.created_at)
    const actual = porFecha.get(fecha) ?? {
      commits: 0,
      pullRequests: 0,
      issues: 0,
    }

    if (evento.type === "PushEvent") {
      actual.commits += evento.payload?.commits?.length ?? 0
    } else if (evento.type === "PullRequestEvent") {
      actual.pullRequests += 1
    } else if (evento.type === "IssuesEvent") {
      actual.issues += 1
    }

    porFecha.set(fecha, actual)
  }

  const db = getDb()
  const ahora = new Date().toISOString()
  let totalCommits = 0

  for (const [fecha, conteo] of porFecha) {
    totalCommits += conteo.commits
    await db
      .insert(githubActividad)
      .values({
        fecha,
        commits: conteo.commits,
        pullRequests: conteo.pullRequests,
        issues: conteo.issues,
        actualizadoEn: ahora,
      })
      .onConflictDoUpdate({
        target: githubActividad.fecha,
        set: {
          commits: conteo.commits,
          pullRequests: conteo.pullRequests,
          issues: conteo.issues,
          actualizadoEn: ahora,
        },
      })
  }

  return {
    ok: true,
    dias: porFecha.size,
    totalCommits,
  }
}
