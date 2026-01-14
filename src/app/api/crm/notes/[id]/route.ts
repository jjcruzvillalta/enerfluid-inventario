import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

const mentionRegex = /@([A-Za-z0-9._-]+)/g;

const extractMentions = (text: string) => {
  const matches = new Set<string>();
  if (!text) return [];
  let match: RegExpExecArray | null = null;
  while ((match = mentionRegex.exec(text)) !== null) {
    if (match[1]) matches.add(match[1].toLowerCase());
  }
  return Array.from(matches.values());
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const { data: note, error } = await supabaseServer
      .from("crm_notes")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error || !note) return new NextResponse("Nota no encontrada", { status: 404 });

    const [clientRes, contactRes, opportunityRes, activityRes, parentRes, repliesRes] = await Promise.all([
      note.client_id
        ? supabaseServer.from("crm_clients").select("id,name").eq("id", note.client_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      note.contact_id
        ? supabaseServer.from("crm_contacts").select("id,name").eq("id", note.contact_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      note.opportunity_id
        ? supabaseServer.from("crm_opportunities").select("id,title").eq("id", note.opportunity_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      note.activity_id
        ? supabaseServer.from("crm_activities").select("id,scheduled_at").eq("id", note.activity_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      note.parent_note_id
        ? supabaseServer
            .from("crm_notes")
            .select("id,detail,author_user_id,created_at")
            .eq("id", note.parent_note_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabaseServer
        .from("crm_notes")
        .select("id,detail,author_user_id,parent_note_id,created_at")
        .eq("parent_note_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

    if (
      clientRes.error ||
      contactRes.error ||
      opportunityRes.error ||
      activityRes.error ||
      parentRes.error ||
      repliesRes.error
    ) {
      return new NextResponse("Error al cargar nota", { status: 500 });
    }

    const userIds = Array.from(
      new Set(
        [note.author_user_id, parentRes.data?.author_user_id, ...(repliesRes.data || []).map((row) => row.author_user_id)].filter(
          Boolean
        )
      )
    );

    const userRows = userIds.length
      ? await supabaseServer.from("app_users").select("id,display_name,username").in("id", userIds)
      : { data: [] };
    const userMap = new Map(
      (userRows.data || []).map((row) => [row.id, row.display_name || row.username])
    );

    const replies = (repliesRes.data || []).map((row) => ({
      ...row,
      author_name: row.author_user_id ? userMap.get(row.author_user_id) || "-" : "-",
    }));

    return NextResponse.json({
      note: {
        ...note,
        author_name: note.author_user_id ? userMap.get(note.author_user_id) || "-" : "-",
      },
      parent: parentRes.data
        ? {
            ...parentRes.data,
            author_name: parentRes.data.author_user_id ? userMap.get(parentRes.data.author_user_id) || "-" : "-",
          }
        : null,
      replies,
      client: clientRes.data || null,
      contact: contactRes.data || null,
      opportunity: opportunityRes.data || null,
      activity: activityRes.data || null,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al cargar nota", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const body = await req.json();
    const detail = body?.detail !== undefined ? String(body.detail || "").trim() : null;

    const updates: Record<string, any> = {};
    if (detail !== null) updates.detail = detail;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseServer.from("crm_notes").update(updates).eq("id", params.id);
    if (error) return new NextResponse("Error al actualizar nota", { status: 500 });

    if (detail !== null) {
      await supabaseServer.from("crm_note_mentions").delete().eq("note_id", params.id);
      await supabaseServer.from("crm_notifications").delete().eq("note_id", params.id).eq("type", "mention");

      const mentions = extractMentions(detail);
      if (mentions.length) {
        const { data: users } = await supabaseServer
          .from("app_users")
          .select("id,username")
          .in("username", mentions);

        const mentionRows = (users || [])
          .filter((user) => user.id !== session.user.id)
          .map((user) => ({
            note_id: params.id,
            mentioned_user_id: user.id,
          }));

        if (mentionRows.length) {
          await supabaseServer.from("crm_note_mentions").insert(mentionRows);
          const notifications = mentionRows.map((row) => ({
            user_id: row.mentioned_user_id,
            note_id: params.id,
            actor_user_id: session.user.id,
            type: "mention",
            is_read: false,
          }));
          await supabaseServer.from("crm_notifications").insert(notifications);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al actualizar nota", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "admin")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const { error } = await supabaseServer.from("crm_notes").delete().eq("id", params.id);
    if (error) return new NextResponse("Error al eliminar nota", { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al eliminar nota", { status: 500 });
  }
}
