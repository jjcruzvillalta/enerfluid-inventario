"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Clientes activos", value: "128" },
  { label: "Oportunidades abiertas", value: "42" },
  { label: "Actividades hoy", value: "18" },
  { label: "Pipeline (USD)", value: "$2.4M" },
];

const pipeline = [
  { stage: "Prospeccion", count: 12, value: "$420k" },
  { stage: "Calificacion", count: 9, value: "$310k" },
  { stage: "Propuesta", count: 11, value: "$780k" },
  { stage: "Negociacion", count: 6, value: "$520k" },
  { stage: "Cierre", count: 4, value: "$370k" },
];

export default function CrmDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Resumen general de clientes y oportunidades.</p>
        </div>
        <Button>Crear oportunidad</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 shadow-soft">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-700">Pipeline por etapa</h2>
          <div className="mt-4 space-y-3">
            {pipeline.map((row) => (
              <div key={row.stage} className="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{row.stage}</p>
                  <p className="text-xs text-slate-500">{row.count} oportunidades</p>
                </div>
                <p className="text-sm font-semibold text-slate-800">{row.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-700">Actividades recientes</h2>
          <div className="mt-4 space-y-3">
            {[
              "Llamada con Enerpump - 10:00",
              "Reunion con Acme - 11:30",
              "Enviar propuesta a Maxis - 14:00",
              "Seguimiento a TechFlow - 16:00",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between text-sm text-slate-600">
                <span>{item}</span>
                <span className="text-xs text-slate-400">Pendiente</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
