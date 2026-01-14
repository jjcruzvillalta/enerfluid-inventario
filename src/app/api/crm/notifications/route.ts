import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

const resolveEntity = (note: any) => {
  if (note.client_id) return { type: "client", id: note.client_id };
  if (note.contact_id) return { type: "contact", id: note.contact_id };
  if (note.opportunity_id) return { type: "opportunity", id: note.opportunity_id };
  if (note.activity_id) return { type: "activity", id: note.activity_id };
  return null;
};

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const { data: notifications, error } = await supabaseServer
      .from("crm_notifications")
      .select("id,note_id,actor_user_id,type,is_read,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return new NextResponse("Error al cargar notificaciones", { status: 500 });

    const noteIds = Array.from(new Set((notifications || []).map((row) => row.note_id).filter(Boolean)));
    const actorIds = Array.from(new Set((notifications || []).map((row) => row.actor_user_id).filter(Boolean)));

    const [notesRes, actorsRes] = await Promise.all([
      noteIds.length
        ? supabaseServer
            .from("crm_notes")
            .select("id,detail,client_id,contact_id,opportunity_id,activity_id")
            .in("id", noteIds)
        : Promise.resolve({ data: [] }),
      actorIds.length
        ? supabaseServer.from("app_users").select("id,display_name,username").in("id", actorIds)
        : Promise.resolve({ data: [] }),
    ]);

    const notesMap = new Map((notesRes.data || []).map((row) => [row.id, row]));
    const actorMap = new Map(
      (actorsRes.data || []).map((row) => [row.id, row.display_name || row.username])
    );

    const payload = (notifications || []).map((row) => {
      const note = row.note_id ? notesMap.get(row.note_id) : null;
      return {
        id: row.id,
        type: row.type,
        is_read: row.is_read,
        created_at: row.created_at,
        note_id: row.note_id,
        actor_name: row.actor_user_id ? actorMap.get(row.actor_user_id) || "-" : "-",
        entity: note ? resolveEntity(note) : null,
        preview: note?.detail ? String(note.detail).slice(0, 140) : "",
      };
    });

    return NextResponse.json({ notifications: payload });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al cargar notificaciones", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];

    let query = supabaseServer.from("crm_notifications").update({ is_read: true }).eq("user_id", session.user.id);
    if (ids.length) query = query.in("id", ids);

    const { error } = await query;
    if (error) return new NextResponse("Error al actualizar notificaciones", { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al actualizar notificaciones", { status: 500 });
  }
}
