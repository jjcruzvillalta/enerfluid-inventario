"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const rows = [
  { name: "Anderson Arguello", company: "Tecmocruz S.A.", role: "Compras", phone: "+593 99 111 222" },
  { name: "Luis Ortega", company: "Enerpump", role: "Gerencia", phone: "+593 98 333 444" },
  { name: "Sofia Diaz", company: "MacroBio", role: "Operaciones", phone: "+593 97 555 666" },
];

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Contactos</h1>
          <p className="text-sm text-slate-500">Personas clave por cuenta.</p>
        </div>
        <Button>Nuevo contacto</Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Buscar contacto" />
          <Input placeholder="Empresa" />
          <Input placeholder="Rol" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-mist">
              <tr>
                <th className="px-3 py-2 text-left">Contacto</th>
                <th className="px-3 py-2 text-left">Empresa</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-left">Telefono</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-slate-100 hover:bg-mist/50">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                  <td className="px-3 py-2">{row.company}</td>
                  <td className="px-3 py-2">{row.role}</td>
                  <td className="px-3 py-2">{row.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
