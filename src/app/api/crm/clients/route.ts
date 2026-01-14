import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const typeId = String(searchParams.get("typeId") || "").trim();
  const city = String(searchParams.get("city") || "").trim();
  const responsibleId = String(searchParams.get("responsibleId") || "").trim();

  try {
    let query = supabaseServer
      .from("crm_clients")
      .select("id,name,city,detail,client_type_id,responsible_user_id,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (q) query = query.ilike("name", `%${q}%`);
    if (typeId) query = query.eq("client_type_id", typeId);
    if (city) query = query.ilike("city", `%${city}%`);
    if (responsibleId) query = query.eq("responsible_user_id", responsibleId);

    const { data: clients, error } = await query;
    if (error) return new NextResponse("Error al cargar clientes", { status: 500 });

    const clientIds = (clients || []).map((row) => row.id);
    const typeIds = Array.from(new Set((clients || []).map((row) => row.client_type_id).filter(Boolean)));
    const userIds = Array.from(new Set((clients || []).map((row) => row.responsible_user_id).filter(Boolean)));

    const typeMap = new Map<string, string>();
    if (typeIds.length) {
      const { data: types } = await supabaseServer
        .from("crm_client_types")
        .select("id,name")
        .in("id", typeIds);
      (types || []).forEach((row) => typeMap.set(row.id, row.name));
    }

    const userMap = new Map<string, string>();
    if (userIds.length) {
      const { data: users } = await supabaseServer
        .from("app_users")
        .select("id,display_name,username")
        .in("id", userIds);
      (users || []).forEach((user) => userMap.set(user.id, user.display_name || user.username));
    }

    const contactsMap = new Map<string, number>();
    if (clientIds.length) {
      const { data: contacts } = await supabaseServer
        .from("crm_contacts")
        .select("client_id")
        .in("client_id", clientIds);
      (contacts || []).forEach((row) => {
        contactsMap.set(row.client_id, (contactsMap.get(row.client_id) || 0) + 1);
      });
    }

    const payload = (clients || []).map((row) => ({
      ...row,
      client_type: row.client_type_id ? typeMap.get(row.client_type_id) || "-" : "-",
      responsible_name: row.responsible_user_id ? userMap.get(row.responsible_user_id) || "-" : "-",
      contacts_count: contactsMap.get(row.id) || 0,
    }));

    return NextResponse.json({ clients: payload });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al cargar clientes", { status: 500 });
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
    const name = String(body?.name || "").trim();
    if (!name) return new NextResponse("Nombre requerido", { status: 400 });

    const payload = {
      name,
      client_type_id: body?.client_type_id || null,
      city: body?.city ? String(body.city).trim() : null,
      detail: body?.detail ? String(body.detail).trim() : null,
      responsible_user_id: body?.responsible_user_id || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from("crm_clients")
      .insert(payload)
      .select("id,name,city,detail,client_type_id,responsible_user_id,created_at,updated_at")
      .maybeSingle();
    if (error) return new NextResponse("Error al crear cliente", { status: 500 });

    return NextResponse.json({ client: data });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al crear cliente", { status: 500 });
  }
}
