"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCrmDialogs } from "@/components/crm/useCrmDialogs";

type ClientRow = {
  id: string;
  name: string;
  city?: string | null;
  client_type?: string | null;
  responsible_name?: string | null;
  contacts_count?: number;
};

type Option = { id: string; name: string };

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [types, setTypes] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [filters, setFilters] = useState({
    q: "",
    typeId: "",
    city: "",
    responsibleId: "",
  });
  const { openClient, createClient, dialogs } = useCrmDialogs({
    onRefresh: () => setRefreshToken((prev) => prev + 1),
  });

  useEffect(() => {
    const loadFilters = async () => {
      const [typesRes, usersRes] = await Promise.all([
        fetch("/api/crm/config?kind=client-types", { cache: "no-store", credentials: "include" }),
        fetch("/api/crm/users", { cache: "no-store", credentials: "include" }),
      ]);
      if (typesRes.ok) {
        const data = await typesRes.json();
        setTypes(data?.items || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers((data?.users || []).map((row: any) => ({ id: row.id, name: row.display_name || row.username })));
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.q) params.set("q", filters.q);
        if (filters.typeId) params.set("typeId", filters.typeId);
        if (filters.city) params.set("city", filters.city);
        if (filters.responsibleId) params.set("responsibleId", filters.responsibleId);
        const res = await fetch(`/api/crm/clients?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setClients(data?.clients || []);
      } finally {
        setLoading(false);
      }
    };
    const timeout = setTimeout(load, 200);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [filters, refreshToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">Listado de cuentas y responsables.</p>
        </div>
        <Button onClick={createClient}>Nuevo cliente</Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Buscar cliente"
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
          />
          <select
            className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink shadow-sm"
            value={filters.typeId}
            onChange={(event) => setFilters((prev) => ({ ...prev, typeId: event.target.value }))}
          >
            <option value="">Tipo</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Ciudad"
            value={filters.city}
            onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
          />
          <select
            className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink shadow-sm"
            value={filters.responsibleId}
            onChange={(event) => setFilters((prev) => ({ ...prev, responsibleId: event.target.value }))}
          >
            <option value="">Responsable</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between pb-3 text-xs text-slate-400">
          <span>{loading ? "Cargando..." : `${clients.length} clientes`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-mist text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Ciudad</th>
                <th className="px-3 py-2 text-left">Responsable</th>
                <th className="px-3 py-2 text-left">Contactos</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-t border-slate-100 hover:bg-mist/50"
                  onClick={() => openClient(row.id)}
                >
                  <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                  <td className="px-3 py-2">{row.client_type || "-"}</td>
                  <td className="px-3 py-2">{row.city || "-"}</td>
                  <td className="px-3 py-2">{row.responsible_name || "-"}</td>
                  <td className="px-3 py-2">{row.contacts_count ?? 0}</td>
                </tr>
              ))}
              {!clients.length && !loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-400">
                    Sin clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {dialogs}
    </div>
  );
}
