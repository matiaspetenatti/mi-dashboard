# Clima — contrato de dirección (rediseño visual)

THESIS: El módulo de clima deja de ser una colección de tarjetas de color relleno (estilo Material You: héroe en primary-container, chips rellenos, fondo de sección coloreado) y pasa a ser un almanaque ligero: suelo neutro, bordes finos de 1 px, una sola familia tipográfica con jerarquía clara, y el color solo como acento de estado (condición del cielo, UV, lluvia). Se niega al bloque de color de fondo, al texto en degradado, al vidrio/difuminado como adorno y a la plantilla "número grande + etiqueta + estadísticas de apoyo" como estructura de página.

OWN-WORLD: Fondo `bg-surface`; tarjetas `bg-surface-container-lowest` con borde `border-outline-variant/40` de 1 px, radio `rounded-2xl` y elevación `shadow-elevation-1` (desplazamiento + difuminado, nunca sombra dura). El acento del módulo (`secondary`, verde) se usa solo en chips de estado, ícono activo y barra de rango de temperatura. Texto `text-on-surface` / `text-on-surface-variant`; sin gris puro. Números en `tabular-nums`. Todo el contenido y las interacciones actuales se conservan sin cambios.

STORY: El visitante responde "¿qué tiempo hará?" a la primera vista: condición y temperatura ahora, selección de día entre 7/16, evolución de temperaturas y lluvia, y detalle horario desplegable. Nada obliga a aprender controles nuevos; el orden de lectura se mantiene.

FORM: posición 6 de la lista generada por concept-seed, modo read, build code-led, seed:6d0554aa9743076c.

FIRST VIEWPORT: cabecera (título Clima, ubicación con coordenadas, botón gestionar ubicaciones), héroe del día (condición + temperatura grande + ícono del clima + mín/máx con barra de rango y marcador de la temperatura actual), tarjetas métrica (viento, UV, humedad, lluvia) y franja atmósfera (presión, visibilidad, nubosidad); a continuación, selector de día y gráfico de evolución de 7/16 días.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
