import { Suspense } from "react";
import { requireAuthorizedUser } from "@/lib/auth";
import {
  EstudioContenido,
  EstudioSkeleton,
} from "@/modules/estudio/contenido";

export default async function EstudioPage() {
  await requireAuthorizedUser();

  return (
    <Suspense fallback={<EstudioSkeleton />}>
      <EstudioContenido />
    </Suspense>
  );
}
