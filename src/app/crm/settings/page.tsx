"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CrmSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Configuracion CRM</h1>
        <p className="text-sm text-slate-500">Ajustes generales del CRM.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <p className="text-xs text-slate-500">Nombre del equipo</p>
          <Input placeholder="Enerfluid CRM" />
        </div>
        <div>
          <p className="text-xs text-slate-500">Moneda</p>
          <Input placeholder="USD" />
        </div>
        <div>
          <p className="text-xs text-slate-500">Objetivo mensual (USD)</p>
          <Input placeholder="250000" />
        </div>
        <Button>Guardar cambios</Button>
      </Card>
    </div>
  );
}
