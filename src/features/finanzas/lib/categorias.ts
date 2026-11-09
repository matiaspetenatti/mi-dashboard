export type CategoriaJerarquia = {
  id: number
  nombre: string
  parentId: number | null
}

export function expandirCategoriaSeleccionada(
  categorias: CategoriaJerarquia[],
  nombre: string,
): string[] {
  const seleccionada = categorias.find((categoria) => categoria.nombre === nombre)

  if (!seleccionada) return [nombre]

  const resultado = new Set<string>([seleccionada.nombre])
  let pendientes = [seleccionada.id]

  while (pendientes.length > 0) {
    const padres = new Set(pendientes)
    const hijos = categorias.filter(
      (categoria) =>
        categoria.parentId !== null && padres.has(categoria.parentId),
    )

    pendientes = []

    for (const hijo of hijos) {
      if (resultado.has(hijo.nombre)) continue
      resultado.add(hijo.nombre)
      pendientes.push(hijo.id)
    }
  }

  return [...resultado]
}
