"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { DetailSection } from "@/components/crm/DetailSection";
import { FieldRow } from "@/components/crm/FieldRow";
import { formatDateTime } from "@/lib/data";

type OpportunityDialogProps = {
  open: boolean;
  opportunityId?: string | null;
  mode?: "create" | "view";
  onClose: () => void;
  onSaved?: () => void;
  onOpenClient?: (id: string) => void;
  onOpenContact?: (id: string) => void;
  onOpenActivity?: (id: string) => void;
  onOpenNote?: (id: string) => void;
  onCreateNote?: (context: { opportunityId: string; parentNoteId?: string; parentPreview?: string }) => void;
};

type OpportunityDetail = {
  opportunity: {
    id: string;
    title: string;
    client_id?: string | null;
    responsible_user_id?: string | null;
    stage_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    closed_at?: string | null;
  };
  client?: { id: string; name: string } | null;
  stage?: { id: string; name: string } | null;
  responsible?: { id: string; name: string } | null;
  contacts: { id: string; name: string; role?: string | null; phone?: string | null; email?: string | null }[];
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

type Option = { id: string; name: string };

type NoteThread = OpportunityDetail["notes"][0] & { replies: OpportunityDetail["notes"] };

export function OpportunityDialog({
  open,
  opportunityId,
  mode = "view",
  onClose,
  onSaved,
  onOpenClient,
  onOpenContact,
  onOpenActivity,
  onOpenNote,
  onCreateNote,
}: OpportunityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(mode === "create");
  const [detail, setDetail] = useState<OpportunityDetail | null>(null);
  const [clients, setClients] = useState<Option[]>([]);
  const [contacts, setContacts] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [stages, setStages] = useState<Option[]>([]);
  const [contactSelection, setContactSelection] = useState<Set<string>>(new Set());
  const [contactFilter, setContactFilter] = useState("");
  const [draft, setDraft] = useState({
    title: "",
    client_id: "",
    responsible_user_id: "",
    stage_id: "",
  });

  const isCreate = mode === "create";

  useEffect(() => {
    if (!open) return;
    const loadConfig = async () => {
      const [clientsRes, usersRes, stagesRes] = await Promise.all([
        fetch("/api/crm/clients", { cache: "no-store", credentials: "include" }),
        fetch("/api/crm/users", { cache: "no-store", credentials: "include" }),
        fetch("/api/crm/config?kind=opportunity-stages", { cache: "no-store", credentials: "include" }),
      ]);
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data?.clients || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers((data?.users || []).map((row: any) => ({ id: row.id, name: row.display_name || row.username })));
      }
      if (stagesRes.ok) {
        const data = await stagesRes.json();
        setStages(data?.items || []);
      }
    };
    loadConfig();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const loadContacts = async () => {
      const res = await fetch(`/api/crm/contacts${draft.client_id ? `?clientId=${draft.client_id}` : ""}`,
        { cache: "no-store", credentials: "include" }
      );
      if (!res.ok) return;
      const data = await res.json();
      setContacts((data?.contacts || []).map((row: any) => ({ id: row.id, name: row.name })));
    };
    loadContacts();
  }, [open, draft.client_id]);

  const loadDetail = async () => {
    if (!opportunityId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/opportunities/${opportunityId}`, { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setDetail(data);
      setDraft({
        title: data?.opportunity?.title || "",
        client_id: data?.opportunity?.client_id || "",
        responsible_user_id: data?.opportunity?.responsible_user_id || "",
        stage_id: data?.opportunity?.stage_id || "",
      });
      setContactSelection(new Set((data?.contacts || []).map((contact: any) => contact.id)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setEditing(isCreate);
    if (isCreate) {
      setDetail(null);
      setDraft({ title: "", client_id: "", responsible_user_id: "", stage_id: "" });
      setContactSelection(new Set());
      return;
    }
    loadDetail();
  }, [open, opportunityId, isCreate]);

  const handleSave = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        client_id: draft.client_id || null,
        responsible_user_id: draft.responsible_user_id || null,
        stage_id: draft.stage_id || null,
        contact_ids: Array.from(contactSelection),
      };
      const res = await fetch(isCreate ? "/api/crm/opportunities" : `/api/crm/opportunities/${opportunityId}`, {
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

  const filteredContacts = useMemo(() => {
    const list = contacts;
    if (!contactFilter.trim()) return list;
    const search = contactFilter.toLowerCase();
    return list.filter((row) => row.name.toLowerCase().includes(search));
  }, [contacts, contactFilter]);

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
        <DialogHeader className="flex flex-col gap-1">
          <DialogTitle>{isCreate ? "Nueva oportunidad" : detail?.opportunity?.title || "Oportunidad"}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{detail?.opportunity?.created_at ? `Creada ${detail.opportunity.created_at.slice(0, 10)}` : ""}</span>
            {detail?.stage?.name ? <Badge variant="outline">{detail.stage.name}</Badge> : null}
          </div>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <DetailSection title="Detalle de oportunidad">
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldRow label="Titulo" value={detail?.opportunity?.title} editing={editing}>
                    <Input
                      value={draft.title}
                      onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Titulo"
                    />
                  </FieldRow>
                  <FieldRow label="Etapa" value={detail?.stage?.name} editing={editing}>
                    <select
                      className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink shadow-sm"
                      value={draft.stage_id}
                      onChange={(event) => setDraft((prev) => ({ ...prev, stage_id: event.target.value }))}
                    >
                      <option value="">Sin etapa</option>
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                    </select>
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
                  <FieldRow label="Responsable" value={detail?.responsible?.name} editing={editing}>
                    <select
                      className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink shadow-sm"
                      value={draft.responsible_user_id}
                      onChange={(event) => setDraft((prev) => ({ ...prev, responsible_user_id: event.target.value }))}
                    >
                      <option value="">Sin responsable</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                </div>
              </DetailSection>

              <DetailSection title="Contactos vinculados">
                {editing ? (
                  <>
                    <Input
                      placeholder="Filtrar contactos"
                      value={contactFilter}
                      onChange={(event) => setContactFilter(event.target.value)}
                    />
                    <div className="mt-3 max-h-40 space-y-2 overflow-auto">
                      {filteredContacts.map((contact) => {
                        const checked = contactSelection.has(contact.id);
                        return (
                          <label key={contact.id} className="flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setContactSelection((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.delete(contact.id);
                                  else next.add(contact.id);
                                  return next;
                                });
                              }}
                            />
                            <span>{contact.name}</span>
                          </label>
                        );
                      })}
                      {!filteredContacts.length ? <p className="text-xs text-slate-400">Sin contactos.</p> : null}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {(detail?.contacts || []).map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-left text-xs text-slate-600 hover:bg-mist"
                        onClick={() => onOpenContact?.(contact.id)}
                      >
                        <span className="font-semibold text-ink">{contact.name}</span>
                        <span>{contact.role || "-"}</span>
                      </button>
                    ))}
                    {!detail?.contacts?.length ? <p className="text-xs text-slate-400">Sin contactos.</p> : null}
                  </div>
                )}
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
                  {!isCreate && opportunityId ? (
                    <Button size="sm" variant="outline" onClick={() => onCreateNote?.({ opportunityId })}>
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
                            onCreateNote?.({
                              opportunityId: opportunityId || "",
                              parentNoteId: note.id,
                              parentPreview: note.detail,
                            })
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
              <Button onClick={handleSave} disabled={!draft.title.trim() || saving}>
                {saving ? "Guardando..." : "Crear"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing((prev) => !prev)}>
                {editing ? "Cancelar" : "Editar"}
              </Button>
              {editing ? (
                <Button onClick={handleSave} disabled={!draft.title.trim() || saving}>
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
