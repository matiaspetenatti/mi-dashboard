import { connection } from "next/server";

function fechaLarga() {
  const texto = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Argentina/Cordoba",
  }).format(new Date());

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export async function TodayLabel() {
  await connection();

  return (
    <span className="rounded-full bg-surface-container px-4 py-2 text-sm text-on-surface-variant">
      {fechaLarga()}
    </span>
  );
}
