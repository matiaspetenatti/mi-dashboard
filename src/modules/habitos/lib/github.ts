import { guardarGithubActividad } from "@/modules/habitos/actions";

const GITHUB_USUARIO = "matiaspetenatti";

function parsearFechaGitHub(fecha: string): string {
  return fecha.slice(0, 10); // "YYYY-MM-DD"
}

/**
 * Obtiene los eventos de GitHub de un usuario y los agrupa por fecha.
 * Solo considera eventos de los últimos 30 días.
 */
export async function sincronizarActividadGitHub(): Promise<{
  ok: boolean;
  totalDias: number;
  totalCommits: number;
  error?: string;
}> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USUARIO}/events?per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "mi-dashboard-habitos",
        },
      },
    );

    if (!res.ok) {
      return {
        ok: false,
        totalDias: 0,
        totalCommits: 0,
        error: `GitHub respondió con estado ${res.status}`,
      };
    }

    const eventos = await res.json();

    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const porFecha = new Map<
      string,
      { commits: number; pullRequests: number; issues: number }
    >();

    for (const evento of eventos) {
      const fechaEvento = new Date(evento.created_at);
      if (fechaEvento < hace30Dias) continue;

      const fecha = parsearFechaGitHub(evento.created_at);
      if (!porFecha.has(fecha)) {
        porFecha.set(fecha, { commits: 0, pullRequests: 0, issues: 0 });
      }

      const actual = porFecha.get(fecha)!;

      if (evento.type === "PushEvent") {
        actual.commits += (evento.payload?.commits?.length ?? 0);
      } else if (evento.type === "PullRequestEvent") {
        actual.pullRequests += 1;
      } else if (evento.type === "IssuesEvent") {
        actual.issues += 1;
      }
    }

    const datos = Array.from(porFecha.entries()).map(
      ([fecha, conteo]) => ({
        fecha,
        commits: conteo.commits,
        pullRequests: conteo.pullRequests,
        issues: conteo.issues,
      }),
    );

    await guardarGithubActividad(datos);

    const totalCommits = datos.reduce((sum, d) => sum + d.commits, 0);

    return {
      ok: true,
      totalDias: datos.length,
      totalCommits,
    };
  } catch (error) {
    console.error("Error sincronizando GitHub:", error);
    return {
      ok: false,
      totalDias: 0,
      totalCommits: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
