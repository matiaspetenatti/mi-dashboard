"use client";

import { useEffect, useState } from "react";

/**
 * Renderiza los hijos solo después de la hidratación en el cliente.
 * Evita errores de hidratación con componentes de terceros (como Clerk UserButton)
 * que generan HTML diferente entre servidor y cliente.
 */
export function SoloCliente({ children }: { children: React.ReactNode }) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMontado(true);
  }, []);

  if (!montado) return null;

  return <>{children}</>;
}
