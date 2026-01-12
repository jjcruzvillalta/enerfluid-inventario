"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const defaultRoles = {
  portal: "standard",
  inventory: "standard",
  crm: "standard",
  users: "standard",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    password: "",
    roles: { ...defaultRoles },
  });
  const [editingId, setEditingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data?.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm({ username: "", displayName: "", password: "", roles: { ...defaultRoles } });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const payload = {
      username: form.username,
      displayName: form.displayName,
      password: form.password,
      roles: form.roles,
    };
    const res = await fetch(editingId ? `/api/users/${editingId}` : "/api/users", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      resetForm();
      loadUsers();
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Eliminar usuario?");
    if (!confirmDelete) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) loadUsers();
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      displayName: user.display_name || "",
      password: "",
      roles: { ...defaultRoles, ...(user.roles || {}) },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-700">{editingId ? "Editar usuario" : "Nuevo usuario"}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Usuario"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          />
          <Input
            placeholder="Nombre visible"
            value={form.displayName}
            onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
          />
          <Input
            placeholder="Clave"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {Object.keys(defaultRoles).map((appKey) => (
            <label key={appKey} className="text-xs text-slate-600">
              {appKey}
              <select
                className="mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink shadow-sm"
                value={form.roles[appKey]}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    roles: { ...prev.roles, [appKey]: event.target.value },
                  }))
                }
              >
                <option value="standard">standard</option>
                <option value="admin">admin</option>
              </select>
            </label>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSubmit}>{editingId ? "Guardar cambios" : "Crear usuario"}</Button>
          {editingId ? (
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Usuarios</h3>
          <span className="text-xs text-slate-400">{loading ? "Cargando..." : `${users.length} usuarios`}</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-mist text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Roles</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.username}</td>
                  <td className="px-3 py-2">{row.display_name}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {Object.entries(row.roles || {}).map(([key, value]) => (
                      <span key={key} className="mr-2 inline-flex rounded-full border px-2 py-0.5">
                        {key}:{value}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(row.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {!users.length && !loading && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-400">
                    Sin usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
