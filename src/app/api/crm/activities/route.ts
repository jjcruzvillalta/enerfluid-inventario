import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

const uniqueIds = (values: any[]) => Array.from(new Set(values.filter(Boolean)));

export async function GET(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const typeId = String(searchParams.get("typeId") || "").trim();
  const outcomeId = String(searchParams.get("outcomeId") || "").trim();
  const clientId = String(searchParams.get("clientId") || "").trim();
  const responsibleId = String(searchParams.get("responsibleId") || "").trim();

  try {
    let query = supabaseServer
      .from("crm_activities")
      .select(
        "id,activity_type_id,outcome_id,client_id,opportunity_id,responsible_user_id,scheduled_at,detail,created_at"
      )
      .order("scheduled_at", { ascending: false });

    if (q) query = query.ilike("detail", `%${q}%`);
    if (typeId) query = query.eq("activity_type_id", typeId);
    if (outcomeId) query = query.eq("outcome_id", outcomeId);
    if (clientId) query = query.eq("client_id", clientId);
    if (responsibleId) query = query.eq("responsible_user_id", responsibleId);

    const { data: activities, error } = await query;
    if (error) return new NextResponse("Error al cargar actividades", { status: 500 });

    const typeIds = uniqueIds((activities || []).map((row) => row.activity_type_id));
    const outcomeIds = uniqueIds((activities || []).map((row) => row.outcome_id));
    const clientIds = uniqueIds((activities || []).map((row) => row.client_id));
    const userIds = uniqueIds((activities || []).map((row) => row.responsible_user_id));

    const [typesRes, outcomesRes, clientsRes, usersRes] = await Promise.all([
      typeIds.length
        ? supabaseServer.from("crm_activity_types").select("id,name").in("id", typeIds)
        : Promise.resolve({ data: [] }),
      outcomeIds.length
        ? supabaseServer.from("crm_activity_outcomes").select("id,name").in("id", outcomeIds)
        : Promise.resolve({ data: [] }),
      clientIds.length
        ? supabaseServer.from("crm_clients").select("id,name").in("id", clientIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabaseServer.from("app_users").select("id,display_name,username").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const typeMap = new Map((typesRes.data || []).map((row) => [row.id, row.name]));
    const outcomeMap = new Map((outcomesRes.data || []).map((row) => [row.id, row.name]));
    const clientMap = new Map((clientsRes.data || []).map((row) => [row.id, row.name]));
    const userMap = new Map(
      (usersRes.data || []).map((row) => [row.id, row.display_name || row.username])
    );

    const payload = (activities || []).map((row) => ({
      ...row,
      type_name: row.activity_type_id ? typeMap.get(row.activity_type_id) || "-" : "-",
      outcome_name: row.outcome_id ? outcomeMap.get(row.outcome_id) || "-" : "-",
      client_name: row.client_id ? clientMap.get(row.client_id) || "-" : "-",
      responsible_name: row.responsible_user_id ? userMap.get(row.responsible_user_id) || "-" : "-",
    }));

    return NextResponse.json({ activities: payload });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al cargar actividades", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const body = await req.json();
    const scheduledAt = body?.scheduled_at ? new Date(body.scheduled_at).toISOString() : null;
    if (!scheduledAt) return new NextResponse("Fecha requerida", { status: 400 });

    const payload = {
      activity_type_id: body?.activity_type_id || null,
      client_id: body?.client_id || null,
      opportunity_id: body?.opportunity_id || null,
      responsible_user_id: body?.responsible_user_id || null,
      scheduled_at: scheduledAt,
      detail: body?.detail ? String(body.detail).trim() : null,
      outcome_id: body?.outcome_id || null,
      updated_at: new Date().toISOString(),
    };

    const { data: activity, error } = await supabaseServer
      .from("crm_activities")
      .insert(payload)
      .select(
        "id,activity_type_id,outcome_id,client_id,opportunity_id,responsible_user_id,scheduled_at,detail,created_at"
      )
      .maybeSingle();
    if (error || !activity) return new NextResponse("Error al crear actividad", { status: 500 });

    const contactIds = Array.isArray(body?.contact_ids) ? body.contact_ids.filter(Boolean) : [];
    if (contactIds.length) {
      const rows = contactIds.map((contactId: string) => ({
        activity_id: activity.id,
        contact_id: contactId,
      }));
      await supabaseServer.from("crm_activity_contacts").insert(rows);
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al crear actividad", { status: 500 });
  }
}
