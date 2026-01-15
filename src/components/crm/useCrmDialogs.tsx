"use client";

import { useState } from "react";
import { ActivityDialog } from "@/components/crm/ActivityDialog";
import { ClientDialog } from "@/components/crm/ClientDialog";
import { ContactDialog } from "@/components/crm/ContactDialog";
import { NoteDialog } from "@/components/crm/NoteDialog";
import { OpportunityDialog } from "@/components/crm/OpportunityDialog";

type NoteContext = {
  clientId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
  activityId?: string | null;
};

type DialogState<TContext = undefined> = {
  open: boolean;
  id: string | null;
  mode: "create" | "view";
  context?: TContext;
};

type NoteState = {
  open: boolean;
  id: string | null;
  context?: NoteContext;
  parentNoteId?: string | null;
  parentPreview?: string | null;
};

type UseCrmDialogsOptions = {
  onRefresh?: () => void;
};

export function useCrmDialogs(options: UseCrmDialogsOptions = {}) {
  const { onRefresh } = options;
  const [refreshToken, setRefreshToken] = useState(0);
  const [clientState, setClientState] = useState<DialogState>({ open: false, id: null, mode: "view" });
  const [contactState, setContactState] = useState<DialogState<{ clientId?: string | null }>>({
    open: false,
    id: null,
    mode: "view",
  });
  const [opportunityState, setOpportunityState] = useState<DialogState<{ clientId?: string | null }>>({
    open: false,
    id: null,
    mode: "view",
  });
  const [activityState, setActivityState] = useState<DialogState<{ clientId?: string | null }>>({
    open: false,
    id: null,
    mode: "view",
  });
  const [noteState, setNoteState] = useState<NoteState>({ open: false, id: null, context: undefined });

  const handleSaved = () => {
    setRefreshToken((prev) => prev + 1);
    onRefresh?.();
  };

  const closeMainDialogs = () => {
    setClientState((prev) => ({ ...prev, open: false }));
    setContactState((prev) => ({ ...prev, open: false }));
    setOpportunityState((prev) => ({ ...prev, open: false }));
    setActivityState((prev) => ({ ...prev, open: false }));
  };

  const openClient = (id: string) => {
    closeMainDialogs();
    setNoteState((prev) => ({ ...prev, open: false, id: null }));
    setClientState({ open: true, id, mode: "view" });
  };

  const createClient = () => {
    closeMainDialogs();
    setNoteState((prev) => ({ ...prev, open: false, id: null }));
    setClientState({ open: true, id: null, mode: "create" });
  };

  const openContact = (id: string) => {
    closeMainDialogs();
    setNoteState((prev) => ({ ...prev, open: false, id: null }));
    setContactState({ open: true, id, mode: "view", context: undefined });
  };

  const createContact = (context?: { clientId?: string | null }) => {
    closeMainDialogs();
    setNoteState((prev) => ({ ...prev, open: false, id: null }));
    setContactState({ open: true, id: null, mode: "create", context });
  };

  const openOpportunity = (id: string) => {
    closeMainDialogs();
    setNoteState((prev) => ({ ...prev, open: false, id: null }));
    setOpportunityState({ open: true, id, mode: "view", context: undefined });
  };

  const createOpportunity = (context?: { clientId?: string | null }) => {
    closeMainDialogs();
    setNoteState((prev) => ({ ...prev, open: false, id: null }));
    setOpportunityState({ open: true, id: null, mode: "create", context });
  };

  const openActivity = (id: string) => {
    closeMainDialogs();
    setNoteState((prev) => ({ ...prev, open: false, id: null }));
    setActivityState({ open: true, id, mode: "view", context: undefined });
  };

  const createActivity = (context?: { clientId?: string | null }) => {
    closeMainDialogs();
    setNoteState((prev) => ({ ...prev, open: false, id: null }));
    setActivityState({ open: true, id: null, mode: "create", context });
  };

  const openNote = (id: string) => {
    setNoteState({ open: true, id, context: undefined });
  };

  const createNote = (context: NoteContext & { parentNoteId?: string; parentPreview?: string }) => {
    setNoteState({
      open: true,
      id: null,
      context,
      parentNoteId: context.parentNoteId || null,
      parentPreview: context.parentPreview || null,
    });
  };

  const dialogs = (
    <>
      <ClientDialog
        open={clientState.open}
        clientId={clientState.id}
        mode={clientState.mode}
        refreshToken={refreshToken}
        onClose={() => setClientState((prev) => ({ ...prev, open: false }))}
        onSaved={handleSaved}
        onOpenContact={openContact}
        onOpenOpportunity={openOpportunity}
        onOpenActivity={openActivity}
        onCreateContact={(context) => createContact(context)}
        onCreateOpportunity={createOpportunity}
        onCreateActivity={(context) => createActivity(context)}
        onOpenNote={openNote}
        onCreateNote={createNote}
      />
      <ContactDialog
        open={contactState.open}
        contactId={contactState.id}
        mode={contactState.mode}
        initialClientId={contactState.context?.clientId || null}
        refreshToken={refreshToken}
        onClose={() => setContactState((prev) => ({ ...prev, open: false }))}
        onSaved={handleSaved}
        onOpenClient={openClient}
        onOpenOpportunity={openOpportunity}
        onOpenActivity={openActivity}
        onCreateActivity={(context) => createActivity(context)}
        onOpenNote={openNote}
        onCreateNote={createNote}
      />
      <OpportunityDialog
        open={opportunityState.open}
        opportunityId={opportunityState.id}
        mode={opportunityState.mode}
        initialClientId={opportunityState.context?.clientId || null}
        refreshToken={refreshToken}
        onClose={() => setOpportunityState((prev) => ({ ...prev, open: false }))}
        onSaved={handleSaved}
        onOpenClient={openClient}
        onOpenContact={openContact}
        onOpenActivity={openActivity}
        onCreateActivity={(context) => createActivity(context)}
        onOpenNote={openNote}
        onCreateNote={createNote}
      />
      <ActivityDialog
        open={activityState.open}
        activityId={activityState.id}
        mode={activityState.mode}
        initialClientId={activityState.context?.clientId || null}
        refreshToken={refreshToken}
        onClose={() => setActivityState((prev) => ({ ...prev, open: false }))}
        onSaved={handleSaved}
        onOpenClient={openClient}
        onOpenOpportunity={openOpportunity}
        onOpenContact={openContact}
        onOpenNote={openNote}
        onCreateNote={createNote}
      />
      <NoteDialog
        open={noteState.open}
        noteId={noteState.id}
        context={noteState.context}
        parentNoteId={noteState.parentNoteId}
        parentPreview={noteState.parentPreview}
        onClose={() => setNoteState((prev) => ({ ...prev, open: false }))}
        onSaved={handleSaved}
      />
    </>
  );

  return {
    openClient,
    createClient,
    openContact,
    createContact,
    openOpportunity,
    createOpportunity,
    openActivity,
    createActivity,
    openNote,
    createNote,
    dialogs,
  };
}
