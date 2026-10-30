---
target: src/modules/clima
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\matias\\Desktop\\Repositorios\\mi-dashboard\\mi-dashboard\\src\\modules\\clima"
timestamp: 2026-10-30T02-47-26Z
slug: src-modules-clima
---
# Crítica de diseño — módulo de clima

**Target:** `src/modules/clima` (slug: `src-modules-clima`)  
**Plataforma:** web (Next.js 16, React 19, Tailwind CSS 4, App Router)  
**Modo:** Operate (dashboard de uso personal)  
**Detector:** limpio (exit 0, sin hallazgos en `src/modules/clima`)  
**Navegador:** no disponible (sin herramienta de automatización de navegador expuesta; overlay omitido)

---

## ⚠️ DEGRADED: single-context (no sub-agent tool exposed)

Ambas evaluaciones (A: revisión de diseño; B: detector + navegador) se ejecutaron en este mismo contexto porque el límite de profundidad impidió spawnear sub-agentes aislados.

---

## Design Health Score

| # | Heurística | Score | Key Issue |
|---|------------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton y estados de error presentes; falta progreso/reintento a nivel de página más allá del error boundary |
| 2 | Match Between System and Real World | 3 | Copy en español, formato es-AR, vientos cardinales en español; algunos términos meteorológicos sin contexto |
| 3 | User Control and Freedom | 3 | Cambio/activación/eliminación de ubicación, cancelación de borrado, reintento de error; no hay deshacer tras eliminar |
| 4 | Consistency and Standards | 3 | Usa widget-card, componentes base y tokens de tema; patrón de módulo consistente |
| 5 | Error Prevention | 3 | Validación de coordenadas, búsqueda ≥2 caracteres, dos pasos para eliminar, Zod en servidor |
| 6 | Recognition Rather Than Recall | 3 | Iconos con etiqueta, ubicación activa resaltada, modos de diálogo visibles |
| 7 | Flexibility and Efficiency | 1 | Sin atajos de teclado, sin navegación por teclado para acciones principales, sin acciones por lote |
| 8 | Aesthetic and Minimalist Design | 2 | Rejilla de hasta 16 días y tabla horaria de 7 columnas generan ruido visual periférico |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3 | Mensajes en español con sugerencia de acción; botón Reintentar en error de página |
| 10 | Help and Documentation | 1 | Sin ayuda, sin tooltips, sin documentación contextual; solo placeholders y descripciones breves |
| **Total** | | **25/40** | **Acceptable** |

**Rating band:** 20–27 = Acceptable. Se necesitan mejoras significativas antes de que los usuarios estén contentos.

---

## Design Specificity Verdict

El módulo se siente authored para este producto, no genérico: usa el acento `secondary` del módulo clima, el bento con héroe de temperatura, el formato `es-AR`, la ubicación por defecto (Río Cuarto, Córdoba), y el registro central en `src/lib/modules.ts`. Sin embargo, varios patrones son intercambiables de categoría: rejilla de días estilo tarjetas, tabla horaria, gráfico de líneas con barras de recharts, y el diálogo de ubicación con pestañas de modo (buscar/GPS/manual) son soluciones de dashboard meteorológico que cualquier app del clima podría usar. Oportunidades perdidas de carácter propio: ausencia de un tono distintivo en el copy, de ilustraciones o micro-interacciones que lo hagan sentir como "mi" clima personal en lugar de un widget genérico.

---

## Deterministic Scan (Assessment B)

El detector sobre `src/modules/clima` devolvió `[]` (exit code 0): sin hallazgos automatizados de marcado. No se detectaron falsos positivos porque no hubo hallazgos. La visualización de navegador (overlay/inyección en pestaña `[Human]`) no se pudo ejecutar porque esta sesión no expone herramienta de automatización de navegador; se omite ese paso. El detector cubre cuestiones mecánicas de marcado, no heurísticas de UX, carga cognitiva ni especificidad de diseño, por lo que su resultado "limpio" no descarta los problemas de diseño reportados más arriba.

---

## Overall Impression

Funciona y se ve consistente con el resto del tablero, pero el módulo de clima se siente denso para lo que es (consultar el pronóstico). El mayor opportunity es reducir la carga de decisión: mostrar menos a la vez, guiar al usuario con ayuda contextual, y añadir caminos de teclado para el uso repetido.

---

## What's Working

1. **Estados de carga, error y vacío bien resueltos.** `ClimaSkeleton`, `ClimaWidgetSkeleton`, `ClimaWidgetError` y el boundary `error.tsx` dan feedback claro en cada transición async. El usuario nunca queda adivinando si algo cargó.
2. **Consistencia visual y de módulo.** Uso correcto de `WidgetCard`, `cn()`, tokens `primary`/`secondary`/`tertiary`, y el patrón de módulo (schema/queries/actions/contenido/widget) se cumple al pie de la letra.
3. **Control del usuario sobre ubicaciones.** Cambiar, activar y eliminar ubicaciones con toasts de confirmación y revalidación de caché es un flujo completo y seguro.

---

## Priority Issues

**[P1] Rejilla de días muestra hasta 16 tarjetas a la vez.**  
**Why it matters:** Más de 4 opciones visibles en un punto de decisión rompe la regla de memoria de trabajo y obliga a escanear horizontalmente en móvil. Es la principal fuente de carga cognitiva de la página.  
**Fix:** Limitar los días visibles (por defecto 5-7) con paginación o un botón "ver más días", y mantener el día seleccionado siempre visible.  
**Suggested command:** `/impeccable layout` — reducir opciones visibles y jerarquizar el selector de día.

**[P1] Ausencia total de ayuda, tooltips y documentación contextual.**  
**Why it matters:** Heurística 10 = 1. Un usuario nuevo no sabe qué significan el índice UV, la sensación térmica o la probabilidad de lluvia sin salir del contexto.  
**Fix:** Añadir tooltips o pistas inline en las métricas del bento y en las columnas de la tabla horaria; un "¿Qué es esto?" breve por métrica.  
**Suggested command:** `/impeccable clarify` — agregar copy de ayuda y tooltips contextuales.

**[P2] No hay atajos de teclado ni camino para usuarios expertos.**  
**Why it matters:** Heurística 7 = 1. Para un módulo consultado a diario, navegar con el ratón entre 16 días es lento; no hay teclado para cambiar de día ni para abrir/cerrar el detalle horario.  
**Fix:** Navegación con flechas entre días, Enter para abrir detalle, Esc para cerrar diálogo y toggle; atajos para cambiar ubicación activa.  
**Suggested command:** `/impeccable adapt` — agregar navegación por teclado y patrones de poder.

**[P2] Ruido visual periférico: tabla horaria de 7 columnas y rejilla densa.**  
**Why it matters:** Heurística 8 = 2. Todo compite por la misma atención; no hay una sola atención primaria clara más allá del héroe de temperatura.  
**Fix:** Jerarquizar columnas (ocultar menos importantes en móvil, agrupar en pestañas o desplegables), reducir la información simultánea.  
**Suggested command:** `/impeccable quieter` — bajar el volumen visual de la tabla horaria y el selector de días.

**[P3] Estados de datos incompletos o vacíos no diseñados explícitamente.**  
**Why it matters:** Si la API devuelve series parciales o un día sin datos, la UI muestra `--` sin explicar por qué ni qué hacer.  
**Fix:** Mensaje específico cuando falta datos de un día o campo, con opción de reintentar ese dato.  
**Suggested command:** `/impeccable harden` — manejar datos parciales con estados explícitos.

---

## Persona Red Flags

**Alex (Power User):**  
Navega el módulo a diario. No hay atajos de teclado para cambiar de día ni para abrir el detalle horario; debe hacer clic en cada tarjeta del selector. No hay acciones por lote (no puede activar varias ubicaciones de un solo golpe). El alta de ubicación obliga a abrir un diálogo completo en lugar de agregar inline. Riesgo de abandono por lentitud en el flujo repetitivo.

**Sam (Accessibility / teclado):**  
La tabla horaria tiene 7 columnas y requiere scroll horizontal en móvil, lo cual rompe la navegación lineal por teclado. El gráfico de recharts es un componente custom que puede romper el flujo de screen reader. Los chips de color del índice UV y la barra de lluvia transmiten significado solo por color (sin etiqueta de texto alternativa clara para el valor exacto en el medidor de 5 segmentos).

**Casey (Móvil, una mano, interrumpida):**  
Las acciones principales (botón "Ubicaciones", selector de días) están en la parte superior de la pantalla, fuera de la zona del pulgar. No hay persistencia de estado si cambia de pestaña o se le interrumpe: al volver, no hay recordatorio de qué día o hora estaba consultando. Cargar 16 días de pronóstico en cada visita pesa en conexiones lentas.

---

## Minor Observations

- El efecto de sincronización en `SelectorUbicacion` (`if (seleccion.propId !== activa.id)`) se ejecuta durante el render, no en un `useEffect`, lo que React desaconseja y puede lanzar advertencias.
- `claseUv` en `contenido.tsx` (3 niveles) es inconsistente con `nivelUv` en `clima-utils.tsx` (5 niveles OMS).
- El placeholder del input de etiqueta en `DialogoUbicacion` muestra coordenadas calculadas con `Number()` antes de que el usuario escriba nada.
- En escritorio el gráfico siempre empieza en el día 0 (`inicioVisible = 0`); las flechas de ventana solo funcionan en móvil.

---

## Questions to Consider

- "¿Qué pasaría si el selector de día mostrara solo los próximos 5-7 días con un botón 'ver más', en lugar de los 16 de golpe?"
- "¿Necesita el módulo sentirse más personal y menos como un widget del tiempo genérico?"
- "¿Debería el detalle horario abrirse por defecto en lugar de ocultarse tras un clic?"

---

## Persistencia del snapshot

Se va a escribir el cuerpo de este reporte (hasta aquí, sin las secciones finales de preguntas) a `.impeccable/critique/` mediante el helper `critique-storage write`, con metadata `IMPECCABLE_CRITIQUE_META`. Después se lee el trend y se anexa la línea de trend, y finalmente se cierra con las preguntas al usuario.
