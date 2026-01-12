"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const rows = [
  { name: "Tecmocruz S.A.", industry: "Industrial", city: "Quito", owner: "Juan Cruz", contacts: 4 },
  { name: "Supmea Portal", industry: "Retail", city: "Guayaquil", owner: "Maria Vera", contacts: 2 },
  { name: "Enerpump", industry: "Energia", city: "Cuenca", owner: "Luis Ortega", contacts: 3 },
  { name: "MacroBio", industry: "Salud", city: "Quito", owner: "Sofia Diaz", contacts: 5 },
];

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">Listado de cuentas y sus contactos clave.</p>
        </div>
        <Button>Nuevo cliente</Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Buscar cliente" />
          <Input placeholder="Industria" />
          <Input placeholder="Ciudad" />
          <Input placeholder="Responsable" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-mist">
              <tr>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">Industria</th>
                <th className="px-3 py-2 text-left">Ciudad</th>
                <th className="px-3 py-2 text-left">Responsable</th>
                <th className="px-3 py-2 text-left">Contactos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-slate-100 hover:bg-mist/50">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                  <td className="px-3 py-2">{row.industry}</td>
                  <td className="px-3 py-2">{row.city}</td>
                  <td className="px-3 py-2">{row.owner}</td>
                  <td className="px-3 py-2">{row.contacts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
