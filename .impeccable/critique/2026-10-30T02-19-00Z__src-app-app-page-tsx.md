---
target: critique the dashboard — src/app/(app)/page.tsx (hub page)
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\matias\\Desktop\\Repositorios\\mi-dashboard\\mi-dashboard\\src\\app\\(app)\\page.tsx"
target_fingerprint: "sha256:bb90251d2f7616c10ea1dae314ad511559569165232a315c78a18edce83f793d"
target_path: "C:\\Users\\matias\\Desktop\\Repositorios\\mi-dashboard\\mi-dashboard\\src\\app\\(app)\\page.tsx"
timestamp: 2026-10-30T02-19-00Z
slug: src-app-app-page-tsx
---
# Crítica de diseño: mi-dashboard — tablero (hub /)

**⚠️ DEGRADED: single-context (sub-agents unavailable — nested session depth limit; Assessment A and Assessment B run inline sequentially in this context)**

Target: `src/app/(app)/page.tsx` (hub page). Modo: Operate (panel personal). Plataforma: web.

## Design Health Score

| # | Heurística | Puntuación | Problema clave |
|---|------------|------------|----------------|
| 1 | Visibilidad del estado del sistema | 3/4 | Skeletons, CountUp y estados activos en la navegación; sin UI de error en 3 de 4 widgets; sin estado de carga global del hub |
| 2 | Relación sistema / mundo real | 3/4 | Copy en español, fechas es-AR, pluralización, moneda ars, días relativos — sólido; algunos nombres internos ("rendimientoDiarioTotal") |
| 3 | Control y libertad del usuario | 2/4 | Hub de solo lectura, poco que deshacer; volver al inicio desde el sidebar/logo existe; no hay cancelar/limpiar (no necesarios aquí) |
| 4 | Consistencia y estándares | 3/4 | Patrón WidgetCard uniforme y sistema de acentos; falla: Animes es un módulo registrado sin widget en el hub |
| 5 | Prevención de errores | 2/4 | No hay acciones destructivas en el hub (solo lectura); Clima tiene error explícito + reintento |
| 6 | Reconocimiento antes que recuerdo | 3/4 | Iconos siempre con etiquetas; estados activos mediante aria-current + pílula; textos truncados (tarea.titulo, proyectoNombre) sin tooltip |
| 7 | Flexibilidad y eficiencia | 1/4 | Sin atajos de teclado, sin acciones masivas, sin personalización, sin favoritos/recientes más allá de las listas de widgets |
| 8 | Diseño estético y minimalista | 3/4 | Limpio, basado en tokens; Clima saturado con seis micro-métricas; la caja "Material pastel" del sidebar es ruido decorativo |
| 9 | Reconocer, diagnosticar y recuperarse de errores | 3/4 | Clima lo resuelve bien ("No se pudo cargar el clima" + "Entrá al módulo para reintentar"); los demás widgets carecen de UI de error y recuperación |
| 10 | Ayuda y documentación | 1/4 | Sin ayuda, tooltips, onboarding ni documentación en ninguna parte |
| **Total** | | **24/40** | **Aceptable** (banda 20–27) |

## Veredicto de especificidad de diseño

**Evaluación del LLM**: Parcialmente authored para este producto, parcialmente intercambiable por categoría. El carácter del producto se ve en la localización española (fechas es-AR, "pendiente/pendientes", "es hoy / día restante / días restantes", moneda ars), la voz "Buen día 👋" / "Tu día, en orden", los tokens de acento por módulo y la caja "Material pastel" del sidebar. Pero la composición del hub — una cuadrícula de tarjetas de métricas con CountUp, skeletons y hover lifts — es un patrón de panel de administración genérico que cualquier producto sin relación podría usar sin cambios. Lo más grave: el producto promete cinco dominios unificados, y el hub solo muestra cuatro (Animes está registrado en `src/lib/modules.ts` pero no tiene widget), por lo que la superficie insignia contradice su propio posicionamiento.

**Escaneo determinista**: `impeccable detect --json` ejecutado sobre `src/app/(app)/page.tsx`, los cuatro widgets de módulos y `src/components` devolvió código de salida 0 — limpio, cero hallazgos. No hay nombres de regla ni ubicaciones de archivo que reportar porque nada fue marcado.

**Superposiciones visuales**: No se intentó. No hay herramienta de navegador/CDP expuesta en esta sesión, por lo que no existe inyección de script ni pestaña `[Human]`; no se debe afirmar que exista una superposición visible al usuario. Señal de respaldo: solo escaneo determinista de CLI, resultado limpio.

## Impresión general

Un panel personal sólido y coherente con buena localización y un sistema de diseño real (tokens, acentos, movimiento). La oportunidad más grande: que el hub cumpla realmente su promesa de unificar los cinco dominios, y agregar las affordances básicas de operación (atajos de teclado, ayuda, recuperación de errores) que una herramienta personal de uso diario necesita.

## Qué funciona

1. **Sistema de módulos consistente.** Cada widget usa la misma forma `WidgetCard`, el mismo token de acento (`primary`/`secondary`/`tertiary`) y el mismo icono, de modo que los cinco dominios se sienten como un producto, no como cinco aplicaciones cosidas. Las pílulas activas del sidebar con animaciones de layout son un toque pulido.
2. **Lenguaje del mundo real.** Copy en español con formato de fechas es-AR, pluralización ("1 pendiente" / "2 pendientes"), moneda ars y copia de días relativos ("es hoy", "día restante"): el usuario nunca tiene que traducir jerga.
3. **Manejo de carga y error por widget.** Suspense con skeletons, animación CountUp y la tarjeta de error explícita de Clima con acción de recuperación ("Entrá al módulo para reintentar") mantienen al usuario informado durante operaciones asíncronas.

## Problemas prioritarios

**[P1] El módulo Animes falta en el hub.** La promesa central del producto son cinco dominios en un solo lugar, pero el hub muestra solo Tareas, Finanzas, Estudio y Clima. Animes está registrado en `src/lib/modules.ts` y ausente de la cuadrícula del hub; el usuario debe recordar que vive solo en el sidebar, lo que rompe el recuerdo y la historia de unificación.
- Corrección: agregar un `AnimesWidget` a la cuadrícula del hub (o delimitar explícitamente el hub a cuatro dominios y actualizar el copy y el posicionamiento).
- Comando sugerido: `/impeccable shape`

**[P2] No hay atajos de teclado ni aceleradores en ninguna parte.** Heurística 7 con 1/4: no hay navegación por teclado, ni acceso rápido, ni acciones masivas. Un panel personal de uso diario penaliza a los usuarios expertos (Alex) en cada visita.
- Corrección: agregar atajos de teclado para cambiar de módulo y para la acción primaria de cada módulo (por ejemplo, nueva tarea).
- Comando sugerido: `/impeccable polish`

**[P2] No hay ayuda, tooltips ni onboarding.** Heurística 10 con 1/4. Los usuarios primerizos (Jordan) no reciben guía; los textos truncados (`tarea.titulo`, `proyectoNombre`) ocultan contenido sin escape mediante tooltip.
- Corrección: agregar tooltips en textos truncados, pistas inline en las tarjetas de métrica y una pista mínima de primer uso.
- Comando sugerido: `/impeccable clarify` (etiquetas/tooltips) y/o `/impeccable onboard`

**[P2] Tres de cuatro widgets carecen de UI de error y recuperación.** Solo Clima tiene estado de error. Una falla de consulta en Tareas/Finanzas/Estudio se muestra como un error de Sinpar no manejado, sin forma de reintentar.
- Corrección: replicar el patrón `ClimaWidgetError` (tarjeta de error + guía de reintento) en los demás widgets.
- Comando sugerido: `/impeccable harden`

**[P3] El widget de Clima está visualmente sobrecargado.** Seis micro-métricas (humedad, lluvia, viento, UV, máxima/mínima, temperatura actual) más una ficha de tendencia compiten por la misma atención dentro de una tarjeta; el diseño estético y minimalista se resiente.
- Corrección: mantener la temperatura y condición titulares, mover las métricas secundarias tras un toque o al detalle del módulo /clima.
- Comando sugerido: `/impeccable distill` o `/impeccable layout`

## Banderas rojas por persona

**Alex (Usuario experto impaciente)** — arquetipo de panel/experto.
- No hay atajos de teclado para cambiar de módulo ni acciones primarias; cada interacción es ratón + navegación de página.
- La animación de entrada escalonada (0,06 s por ítem, ~0,24 s total) se reproduce en cada visita y solo se puede saltar más allá con `prefers-reduced-motion`.
- No hay acciones masivas ni acceso rápido; flujos de uno en uno donde lo natural sería por lotes.
- Resultado: abandona o evita el hub para el uso diario repetido.

**Sam (Usuario dependiente de accesibilidad)** — lector de pantalla / solo teclado.
- El texto truncado (`tarea.titulo`, `proyectoNombre`, recortes de estudio) no tiene tooltip, por lo que el contenido desbordado es inalcanzable para usuarios de teclado y lectores de pantalla.
- Ingresos (+ verde) / Gastos (− rojo) diferencian principalmente por color (los signos de texto están presentes, lo que mitiga parcialmente).
- No hay anuncios de región viva para estados de carga o éxito de los widgets; la carga solo se comunica visualmente con skeletons.
- Resultado: los usuarios de lector de pantalla no pueden confirmar cambios de estado de los widgets ni leer el contenido truncado.

## Observaciones menores

- El saludo "Buen día 👋" es ajeno a la hora: dice lo mismo a las 7 de la mañana y a las 9 de la noche.
- `TodayLabel` llama a `connection()` (conexión a base de datos) solo para renderizar la fecha local: trabajo asíncrono innecesario en el hub.
- La descripción del hub lee "Un vistazo rápido a tus tareas, finanzas y estudio" y omite Clima y Animes, vendiendo menos la unificación.
- La caja promo "Material pastel" del sidebar es decorativa y su propósito no está claro; compite con la navegación por atención.
- Los estados vacíos son cálidos ("Sin exámenes cargados por delante", "Todo al día 🎉"): mantener ese tono.

## Preguntas a considerar

- "¿Qué pasaría si el hub tuviera que probar su promesa de cinco dominios en una sola pantalla?"
- "¿Un panel personal de uso diario necesita más atajos de teclado que pulido de animaciones?"
- "¿Cómo sería una versión confiada de esto?"
