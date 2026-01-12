"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const rows = [
  { name: "Renovacion bombas", account: "Tecmocruz S.A.", stage: "Propuesta", value: "$180k" },
  { name: "Contrato mantenimiento", account: "Enerpump", stage: "Negociacion", value: "$240k" },
  { name: "Compra valvulas", account: "MacroBio", stage: "Calificacion", value: "$90k" },
];

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Oportunidades</h1>
          <p className="text-sm text-slate-500">Pipeline comercial por etapa.</p>
        </div>
        <Button>Nueva oportunidad</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {["Prospeccion", "Propuesta", "Negociacion"].map((stage) => (
          <Card key={stage} className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">{stage}</h2>
              <span className="text-xs text-slate-400">3</span>
            </div>
            <div className="mt-4 space-y-3">
              {rows
                .filter((row) => row.stage === stage)
                .map((row) => (
                  <div key={row.name} className="rounded-2xl border border-line p-3">
                    <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.account}</p>
                    <p className="text-xs font-semibold text-slate-700">{row.value}</p>
                  </div>
                ))}
              {!rows.some((row) => row.stage === stage) && (
                <p className="text-xs text-slate-400">Sin oportunidades.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
