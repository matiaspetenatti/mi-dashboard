---
target: critique the dashboard — src/app/(app)/page.tsx (hub page)
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\matias\\Desktop\\Repositorios\mi-dashboard\mi-dashboard\src\app\(app)\page.tsx"
target_fingerprint: "sha256:1aaf7a342ce0322d79d3912a2ac01880d0b7a8ddf91021da55c723d9f5ffe22d"
target_path: "C:\\Users\\matias\\Desktop\Repositorios\mi-dashboard\mi-dashboard\src\app\(app)\page.tsx"
timestamp: 2026-10-30T15-16-13Z
slug: src-app-app-page-tsx
---

# Crítica de diseño: mi-dashboard — tablero (hub /)

⚠️ DEGRADED: single-context (no nested sub-agents allowed at this depth; `impeccable` launcher blocked by the shell scanner so only a partial `detect` CLI scan and a `context` probe ran; no browser automation tool exposed — Assessment B browser/overlay evidence unavailable)

Target: `src/app/(app)/page.tsx` (hub page). Modo: Operate (panel personal). Plataforma: web.

## Design Health Score

| # | Heurística | Puntuación | Problema clave |
|---|------------|------------|----------------|
| 1 | Visibilidad del estado del sistema | 2/4 | Fecha y "Sistema en línea" presentes, pero el hub no tiene estados de carga ni de error: todo son datos hardcodeados que se hacen pasar por telemetría en vivo; el toaster existe y no se usa |
| 2 | Relación sistema / mundo real | 3/4 | Copy en español, fechas es-AR, moneda ARS con coma decimal, días relativos ("Hace 5 días"); falla: footer de telemetría con jerga ("Node: cordoba-ar01", "Ping: 14ms") y descripción del hub que omite Clima y Animes |
| 3 | Control y libertad del usuario | 2/4 | Hub de solo lectura (nada que deshacer); enlaces de salida existen ("Nueva tarea", "Ir a Finanzas", "Ver pronóstico completo") |
| 4 | Consistencia y estándares | 2/4 | Dos sistemas de diseño compiten: tokens Wise en globals.css/sidebar/widget-card vs valores hex hardcodeados en page.tsx; `accentStyles` de `modules.ts` hace idénticos primary/secondary/tertiary (todos `bg-lime-voltage`) |
| 5 | Prevención de errores | 3/4 | Solo lectura, sin formularios ni acciones destructivas: poco que prevenir |
| 6 | Reconocimiento antes que recuerdo | 3/4 | Iconos siempre con etiqueta y estados activos con aria-current; falla: títulos truncados sin tooltip (títulos de anime, etiquetas del sidebar) |
| 7 | Flexibilidad y eficiencia | 1/4 | Sin atajos de teclado, sin acciones masivas, sin personalización; animaciones (👋 saltarín, puntos ping) se reproducen en cada visita |
| 8 | Diseño estético y minimalista | 2/4 | Ruido decorativo: borraduras radiales por widget, animate-ping, gradientes, emoji saltarín; dos sistemas de diseño peleando por la misma pantalla |
| 9 | Reconocer, diagnosticar y recuperarse de errores | 1/4 | Sin UI de error ni recuperación en el hub; si una API falla, el usuario no lo sabe ni puede reintentar |
| 10 | Ayuda y documentación | 1/4 | Sin ayuda, tooltips ni onboarding en ninguna parte |
| **Total** | | **20/40** | **Aceptable** (banda 20–27, fondo de banda) |

## Veredicto de especificidad de diseño

**Especifidad baja para la identidad del producto.** El hub usa un estilo "Neon Control Room" genérico: acentos índigo/esmeralda/ámbar/cielo, gradientes, borraduras radiales, animaciones `animate-bounce` y `animate-ping` — un panel de administración intercambiable por categoría, lo que confirma el detector (antipatrones `ai-color-palette` en la tarjeta de anime, línea 1034, y `bounce-easing` en el saludo, línea 119). Mientras tanto, el sistema de diseño real del producto (Wise: Forest Ink #163300 + Lime Voltage #9fe870, píldoras, Inter / Wise Sans) está definido en `globals.css` y `AGENTS.md` pero el hub ignora todos sus tokens, y `src/lib/modules.ts` rompe el mapa de acentos (primary, secondary y tertiary mapean todos a `bg-lime-voltage`). La copia SÍ está authored para el producto (es-AR, ARS, "Buen día 👋", "Tu día, en orden"), pero la composición visual es un patrón de panel genérico que cualquier producto sin relación podría usar sin cambios.

**Escaneo determinista**: `impeccable detect --json` sobre `src/app` devolvió 3 hallazgos (salida 2): dos warnings `ai-color-palette` (gradiente índigo en `src/app/(app)/page.tsx:1034`) y un advisory `bounce-easing` (línea 119, `animate-bounce` del 👋). Corroboran la revisión: paleta de "estilo IA" y animación no prescindible. La visualización de navegador / inyección de overlay no fue posible (no hay herramienta de automatización de navegador expuesta en esta sesión).

## Impresión general

Un hub limpio y legible a primera vista, con buena localización y los cinco dominios ya representados en cuadrícula (se cerró la brecha previa de Animes). Pero es un monolito de 1.192 líneas con todo hardcodeado, sin estados de carga ni error, sin atajos y sin ayuda; además finge telemetría en vivo ("Sistema en línea · Ping 14ms") con datos estáticos. La oportunidad más grande: que el hub cumpla de verdad su promesa de unificar los cinco dominios, usando el sistema de diseño ya definido en lugar de competir con él.

## Qué funciona

1. **Localización real.** Copy en español con formato es-AR ("Viernes, 30 de octubre"), moneda ARS ($ 358.368,84), días relativos y pluralización implícita: el usuario nunca traduce jerga.
2. **Los cinco dominios en un solo lugar.** El hub muestra Tareas, Finanzas, Estudio, Clima y Animes & Entretenimiento con una forma de tarjeta repetida: la historia de unificación ahora se cumple en la superficie insignia.
3. **Píldoras activas del sidebar con animación de layout y tema toggle.** `aria-current` + píldora `motion` dan ubicación clara; el alternador claro/oscuro respeta `color-scheme`.
4. **Patrón de referencia en `src/modules/clima/widget.tsx`.** Skeleton + tarjeta de error explícita ("No se pudo cargar el clima" + "Entrá al módulo para reintentar") es exactamente el modelo que los otros widgets del hub necesitan.

## Problemas prioritarios

**[P1] Dos sistemas de diseño compitiendo en el hub.** `page.tsx` ignora los tokens Wise (`globals.css`) y usa valores hex arbitrarios (#405bff, #0a0a0a, gradientes, blur); `accentStyles` de `modules.ts` mapea primary/secondary/tertiary a lo mismo, por lo que los módulos del sidebar no se distinguen por color.
- Corrección: extraer los widgets del hub en componentes, usar `WidgetCard` + los tokens Wise, diferenciar los acentos por módulo y eliminar los valores hardcodeados de `page.tsx`.
- Comando sugerido: `/impeccable polish` (alineamiento al sistema de diseño existente).

**[P1] Hub monolítico sin estados de carga ni error.** 1.192 líneas, datos hardcodeados que se hacen pasar por telemetría en vivo; si falla una consulta el usuario no lo ve ni puede reintentar.
- Corrección: agregar `Suspense` + skeleton + tarjeta de error por widget (copiar el patrón `ClimaWidgetError`); eliminar o hacer real el footer de telemetría.
- Comando sugerido: `/impeccable harden`.

**[P2] Sin atajos de teclado ni aceleradores; animaciones no saltables.** Heurística 7 con 1/4: cambiar de módulo y la acción primaria de cada uno requieren ratón; el 👋 saltarín (2.2 s) y los puntos ping se reproducen cada visita, solo evitables con `prefers-reduced-motion`.
- Corrección: atajos de teclado para cambiar de módulo y acciones primarias (p. ej., nueva tarea).
- Comando sugerido: `/impeccable polish`.

**[P2] Sin ayuda, tooltips ni onboarding.** Heurística 10 con 1/4: los usuarios primerizos no reciben guía; los textos truncados (títulos de anime, etiquetas del sidebar) ocultan contenido sin escape mediante tooltip.
- Corrección: tooltips en truncados, pistas inline en las tarjetas de métrica y una pista mínima de primer uso.
- Comando sugerido: `/impeccable clarify` (etiquetas/tooltips) y `/impeccable onboard`.

**[P3] Saludo ajeno a la hora y gradientes de "estilo IA".** "Buen día 👋" dice lo mismo a las 7 de la mañana y a las 9 de la noche; el detector marca `bounce-easing` (línea 119) y `ai-color-palette` (línea 1034).
- Corrección: saludo según la hora, quitar el bounce, sustituir gradientes por una paleta intencional.
- Comando sugerido: `/impeccable quieter`.

## Banderas rojas por persona

**Alex (Usuario experto impaciente)** — arquetipo de panel/experto.
- No hay atajos de teclado para cambiar de módulo ni para las acciones primarias; cada interacción es ratón + navegación de página.
- La animación de entrada del 👋 (2.2 s) y los puntos ping se reproducen en cada visita.
- Flujos uno en uno donde lo natural sería por lotes.
- Resultado: abandona o evita el hub para el uso diario repetido.

**Sam (Usuario dependiente de accesibilidad)** — lector de pantalla / solo teclado.
- Los textos truncados (títulos de anime, etiquetas del sidebar) no tienen tooltip, por lo que el contenido desbordado es inalcanzable.
- No hay anuncios de región viva para estados de carga o éxito de los widgets; la carga solo se comunica visualmente.
- El script de tema con `suppressHydrationWarning` puede causar destello al alternar claro/oscuro.
- Resultado: los usuarios de lector de pantalla no pueden confirmar cambios de estado ni leer el contenido truncado.

**Casey (Usuario móvil distraído)** — una mano, de paso.
- La navegación inferior existe, pero las acciones primarias ("Nueva tarea") quedan arriba de cada tarjeta, fuera de la zona del pulgar.
- Gradientes y borraduras se cargan en cada visita.

## Observaciones menores

- La descripción del hub lee "Un vistazo rápido a tus tareas, finanzas y estudio" y omite Clima y Animes, vendiendo menos la unificación.
- La caja promo "Material pastel" del sidebar es decorativa y su propósito no está claro; compite con la navegación por atención.
- El footer de telemetría ("Node: cordoba-ar01 · Ping: 14ms · v2.4.0") es jerga de DevOps sobre un panel personal.
- `today-label.tsx` llama a `connection()` (base de datos) solo para renderizar la fecha local: trabajo asíncrono innecesario (aunque no se usa en el hub actual).
- Datos del hub hardcodeados (6 pendientes, $ 358.368,84, 3% de avance): "telemetría" de teatro.

## Preguntas a considerar

- "¿Qué pasaría si el hub tuviera que demostrar realmente que sus datos están en vivo?"
- "¿Un panel personal de uso diario necesita más atajos de teclado que pulido visual?"
- "¿El aspecto 'Neon Control Room' del hub es intencional, o debería adoptar el sistema Wise definido en `globals.css`?"

> **Trend for `src-app-app-page-tsx` (last 5 runs): 24 → 20 (out of 40)**
> Wrote `.impeccable/critique/2026-10-30T15-16-13Z__src-app-app-page-tsx.md`.
> Nota: la ejecución previa (24/40) valoró una implementación anterior del hub (tarjetas `WidgetCard`, skeletons, CountUp, UI de error de Clima) que ya no existe; el hub actual fue reescrito como un monolito Neon, por lo que la caída de 4 puntos refleja una regresión real en esta superficie, no solo una re-puntuación. Ambos runs usan el mismo juego de 10 heurísticas (/40), así que la comparación es directamente comparable.
