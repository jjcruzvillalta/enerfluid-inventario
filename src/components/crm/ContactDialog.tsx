"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { DetailSection } from "@/components/crm/DetailSection";
import { FieldRow } from "@/components/crm/FieldRow";
import { formatDateTime } from "@/lib/data";

type ContactDialogProps = {
  open: boolean;
  contactId?: string | null;
  mode?: "create" | "view";
  onClose: () => void;
  onSaved?: () => void;
  onOpenClient?: (id: string) => void;
  onOpenOpportunity?: (id: string) => void;
  onOpenActivity?: (id: string) => void;
  onOpenNote?: (id: string) => void;
  onCreateNote?: (context: { contactId: string; parentNoteId?: string; parentPreview?: string }) => void;
};

type ContactDetail = {
  contact: {
    id: string;
    name: string;
    role?: string | null;
    phone?: string | null;
    email?: string | null;
    detail?: string | null;
    client_id?: string | null;
  };
  client?: { id: string; name: string } | null;
  opportunities: {
    id: string;
    title: string;
    stage_name?: string | null;
    responsible_name?: string | null;
  }[];
  activities: {
    id: string;
    scheduled_at?: string | null;
    type_name?: string | null;
    outcome_name?: string | null;
  }[];
  notes: {
    id: string;
    detail: string;
    author_name?: string | null;
    parent_note_id?: string | null;
    created_at?: string | null;
  }[];
};

type ClientOption = { id: string; name: string };

type NoteThread = ContactDetail["notes"][0] & { replies: ContactDetail["notes"] };

export function ContactDialog({
  open,
  contactId,
  mode = "view",
  onClose,
  onSaved,
  onOpenClient,
  onOpenOpportunity,
  onOpenActivity,
  onOpenNote,
  onCreateNote,
}: ContactDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(mode === "create");
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [draft, setDraft] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    detail: "",
    client_id: "",
  });

  const isCreate = mode === "create";

  useEffect(() => {
    if (!open) return;
    const loadClients = async () => {
      const res = await fetch("/api/crm/clients", { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setClients(data?.clients || []);
    };
    loadClients();
  }, [open]);

  const loadDetail = async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/contacts/${contactId}`, { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setDetail(data);
      setDraft({
        name: data?.contact?.name || "",
        role: data?.contact?.role || "",
        phone: data?.contact?.phone || "",
        email: data?.contact?.email || "",
        detail: data?.contact?.detail || "",
        client_id: data?.contact?.client_id || "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setEditing(isCreate);
    if (isCreate) {
      setDetail(null);
      setDraft({ name: "", role: "", phone: "", email: "", detail: "", client_id: "" });
      return;
    }
    loadDetail();
  }, [open, contactId, isCreate]);

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        role: draft.role.trim() || null,
        phone: draft.phone.trim() || null,
        email: draft.email.trim() || null,
        detail: draft.detail.trim() || null,
        client_id: draft.client_id || null,
      };
      const res = await fetch(isCreate ? "/api/crm/contacts" : `/api/crm/contacts/${contactId}`, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      if (!isCreate) await loadDetail();
      onSaved?.();
      if (isCreate) onClose();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const noteThreads = useMemo<NoteThread[]>(() => {
    const notes = detail?.notes || [];
    const map = new Map<string, NoteThread>();
    notes.forEach((note) => {
      map.set(note.id, { ...note, replies: [] });
    });
    notes.forEach((note) => {
      if (note.parent_note_id && map.has(note.parent_note_id)) {
        map.get(note.parent_note_id)!.replies.push(note);
      }
    });
    return notes.filter((note) => !note.parent_note_id).map((note) => map.get(note.id)!).filter(Boolean);
  }, [detail]);

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="w-[96vw] max-w-5xl">
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full border border-line bg-white p-1 text-slate-500 shadow-sm hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Nuevo contacto" : detail?.contact?.name || "Contacto"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <DetailSection title="Datos del contacto">
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldRow label="Nombre" value={detail?.contact?.name} editing={editing}>
                    <Input
                      value={draft.name}
                      onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Nombre"
                    />
                  </FieldRow>
                  <FieldRow label="Cargo" value={detail?.contact?.role} editing={editing}>
                    <Input
                      value={draft.role}
                      onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value }))}
                      placeholder="Cargo"
                    />
                  </FieldRow>
                  <FieldRow label="Telefono" value={detail?.contact?.phone} editing={editing}>
                    <Input
                      value={draft.phone}
                      onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="Telefono"
                    />
                  </FieldRow>
                  <FieldRow label="Email" value={detail?.contact?.email} editing={editing}>
                    <Input
                      value={draft.email}
                      onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="Email"
                    />
                  </FieldRow>
                  <FieldRow label="Cliente" value={detail?.client?.name} editing={editing}>
                    <select
                      className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink shadow-sm"
                      value={draft.client_id}
                      onChange={(event) => setDraft((prev) => ({ ...prev, client_id: event.target.value }))}
                    >
                      <option value="">Sin cliente</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                  <div className="md:col-span-2">
                    <FieldRow label="Detalle" value={detail?.contact?.detail} editing={editing}>
                      <textarea
                        className="min-h-[90px] w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                        value={draft.detail}
                        onChange={(event) => setDraft((prev) => ({ ...prev, detail: event.target.value }))}
                        placeholder="Notas del contacto"
                      />
                    </FieldRow>
                  </div>
                </div>
              </DetailSection>

              <DetailSection title={`Oportunidades (${detail?.opportunities?.length || 0})`}>
                <div className="space-y-2">
                  {(detail?.opportunities || []).map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-left text-xs text-slate-600 hover:bg-mist"
                      onClick={() => onOpenOpportunity?.(deal.id)}
                    >
                      <span className="font-semibold text-ink">{deal.title}</span>
                      <span>{deal.stage_name || "-"}</span>
                    </button>
                  ))}
                  {!detail?.opportunities?.length ? <p className="text-xs text-slate-400">Sin oportunidades.</p> : null}
                </div>
              </DetailSection>
            </div>

            <div className="space-y-4">
              <DetailSection title={`Actividades (${detail?.activities?.length || 0})`}>
                <div className="space-y-2">
                  {(detail?.activities || []).map((activity) => (
                    <button
                      key={activity.id}
                      type="button"
                      className="flex w-full flex-col gap-1 rounded-xl border border-line bg-white px-3 py-2 text-left text-xs text-slate-600 hover:bg-mist"
                      onClick={() => onOpenActivity?.(activity.id)}
                    >
                      <span className="font-semibold text-ink">{activity.type_name || "Actividad"}</span>
                      <span>{formatDateTime(activity.scheduled_at)}</span>
                    </button>
                  ))}
                  {!detail?.activities?.length ? <p className="text-xs text-slate-400">Sin actividades.</p> : null}
                </div>
              </DetailSection>

              <DetailSection title="Notas">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-xs text-slate-400">{detail?.notes?.length || 0} notas</p>
                  {!isCreate && contactId ? (
                    <Button size="sm" variant="outline" onClick={() => onCreateNote?.({ contactId })}>
                      Nueva nota
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-3">
                  {noteThreads.map((note) => (
                    <div key={note.id} className="rounded-xl border border-line bg-white px-3 py-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{note.author_name || "-"}</span>
                        <span>{note.created_at ? note.created_at.slice(0, 10) : "-"}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{note.detail}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onOpenNote?.(note.id)}>
                          Ver nota
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            onCreateNote?.({ contactId: contactId || "", parentNoteId: note.id, parentPreview: note.detail })
                          }
                        >
                          Responder
                        </Button>
                      </div>
                      {note.replies.length ? (
                        <div className="mt-3 space-y-2 border-l border-line pl-3">
                          {note.replies.map((reply) => (
                            <div key={reply.id} className="text-xs text-slate-600">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-ink">{reply.author_name || "-"}</span>
                                <span>{reply.created_at ? reply.created_at.slice(0, 10) : "-"}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-700">{reply.detail}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {!noteThreads.length ? <p className="text-xs text-slate-400">Sin notas.</p> : null}
                </div>
              </DetailSection>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          {isCreate ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!draft.name.trim() || saving}>
                {saving ? "Guardando..." : "Crear"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing((prev) => !prev)}>
                {editing ? "Cancelar" : "Editar"}
              </Button>
              {editing ? (
                <Button onClick={handleSave} disabled={!draft.name.trim() || saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
