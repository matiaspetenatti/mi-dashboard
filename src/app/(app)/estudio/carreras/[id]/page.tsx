import { notFound } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/auth";
import { DetalleCarrera } from "@/modules/estudio/components/detalle-carrera";
import { getCarreraDetalle } from "@/modules/estudio/queries";

export default async function CarreraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuthorizedUser();

  const { id } = await params;
  const carreraId = Number(id);

  if (!Number.isInteger(carreraId) || carreraId <= 0) {
    notFound();
  }

  const detalle = await getCarreraDetalle(carreraId);
  if (!detalle) {
    notFound();
  }

  return <DetalleCarrera {...detalle} />;
}
