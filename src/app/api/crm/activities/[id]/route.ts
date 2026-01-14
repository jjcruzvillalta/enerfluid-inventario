import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const { data: activity, error } = await supabaseServer
      .from("crm_activities")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error || !activity) return new NextResponse("Actividad no encontrada", { status: 404 });

    const [typeRes, outcomeRes, responsibleRes, clientRes, opportunityRes, contactsLinks, notesRes] = await Promise.all([
      activity.activity_type_id
        ? supabaseServer.from("crm_activity_types").select("id,name").eq("id", activity.activity_type_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      activity.outcome_id
        ? supabaseServer.from("crm_activity_outcomes").select("id,name,is_effective").eq("id", activity.outcome_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      activity.responsible_user_id
        ? supabaseServer
            .from("app_users")
            .select("id,display_name,username")
            .eq("id", activity.responsible_user_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      activity.client_id
        ? supabaseServer.from("crm_clients").select("id,name").eq("id", activity.client_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      activity.opportunity_id
        ? supabaseServer.from("crm_opportunities").select("id,title").eq("id", activity.opportunity_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabaseServer.from("crm_activity_contacts").select("contact_id").eq("activity_id", params.id),
      supabaseServer
        .from("crm_notes")
        .select("id,detail,author_user_id,parent_note_id,created_at")
        .eq("activity_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

    if (
      typeRes.error ||
      outcomeRes.error ||
      responsibleRes.error ||
      clientRes.error ||
      opportunityRes.error ||
      contactsLinks.error ||
      notesRes.error
    ) {
      return new NextResponse("Error al cargar detalle", { status: 500 });
    }

    const contactIds = Array.from(new Set((contactsLinks.data || []).map((row) => row.contact_id)));
    const contactsRes = contactIds.length
      ? await supabaseServer.from("crm_contacts").select("id,name,role,phone,email").in("id", contactIds)
      : { data: [] };

    const noteUserIds = Array.from(new Set((notesRes.data || []).map((row) => row.author_user_id).filter(Boolean)));
    const noteUsersRes = noteUserIds.length
      ? await supabaseServer.from("app_users").select("id,display_name,username").in("id", noteUserIds)
      : { data: [] };
    const userMap = new Map(
      (noteUsersRes.data || []).map((row) => [row.id, row.display_name || row.username])
    );

    const notes = (notesRes.data || []).map((row) => ({
      ...row,
      author_name: row.author_user_id ? userMap.get(row.author_user_id) || "-" : "-",
    }));

    return NextResponse.json({
      activity,
      type: typeRes.data || null,
      outcome: outcomeRes.data || null,
      responsible: responsibleRes.data
        ? { id: responsibleRes.data.id, name: responsibleRes.data.display_name || responsibleRes.data.username }
        : null,
      client: clientRes.data || null,
      opportunity: opportunityRes.data || null,
      contacts: contactsRes.data || [],
      notes,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al cargar actividad", { status: 500 });
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
    const updates: Record<string, any> = {};
    if (body?.activity_type_id !== undefined) updates.activity_type_id = body.activity_type_id || null;
    if (body?.client_id !== undefined) updates.client_id = body.client_id || null;
    if (body?.opportunity_id !== undefined) updates.opportunity_id = body.opportunity_id || null;
    if (body?.responsible_user_id !== undefined) updates.responsible_user_id = body.responsible_user_id || null;
    if (body?.scheduled_at !== undefined) {
      updates.scheduled_at = body.scheduled_at ? new Date(body.scheduled_at).toISOString() : null;
    }
    if (body?.detail !== undefined) updates.detail = String(body.detail || "").trim();
    if (body?.outcome_id !== undefined) updates.outcome_id = body.outcome_id || null;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseServer.from("crm_activities").update(updates).eq("id", params.id);
    if (error) return new NextResponse("Error al actualizar actividad", { status: 500 });

    if (Array.isArray(body?.contact_ids)) {
      await supabaseServer.from("crm_activity_contacts").delete().eq("activity_id", params.id);
      const contactIds = body.contact_ids.filter(Boolean);
      if (contactIds.length) {
        const rows = contactIds.map((contactId: string) => ({
          activity_id: params.id,
          contact_id: contactId,
        }));
        await supabaseServer.from("crm_activity_contacts").insert(rows);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al actualizar actividad", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "admin")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const { error } = await supabaseServer.from("crm_activities").delete().eq("id", params.id);
    if (error) return new NextResponse("Error al eliminar actividad", { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al eliminar actividad", { status: 500 });
  }
}
