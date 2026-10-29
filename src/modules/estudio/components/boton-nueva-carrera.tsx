"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogoCarrera } from "./dialogo-carrera";

export function BotonNuevaCarrera() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setAbierto(true)}>
        <Plus />
        Nueva carrera
      </Button>
      <DialogoCarrera
        key={abierto ? "carrera-abierta" : "carrera-cerrada"}
        abierto={abierto}
        onOpenChange={setAbierto}
      />
    </>
  );
}
