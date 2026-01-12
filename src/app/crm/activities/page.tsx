"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const rows = [
  { title: "Llamada con Enerpump", time: "10:00", owner: "Juan Cruz" },
  { title: "Reunion con Tecmocruz", time: "11:30", owner: "Sofia Diaz" },
  { title: "Enviar propuesta MacroBio", time: "14:00", owner: "Luis Ortega" },
];

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Actividades</h1>
          <p className="text-sm text-slate-500">Agenda y seguimiento diario.</p>
        </div>
        <Button>Nueva actividad</Button>
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.title} className="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{row.title}</p>
                <p className="text-xs text-slate-500">{row.owner}</p>
              </div>
              <span className="text-xs text-slate-500">{row.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
