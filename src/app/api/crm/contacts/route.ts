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
  const clientId = String(searchParams.get("clientId") || "").trim();

  try {
    let query = supabaseServer
      .from("crm_contacts")
      .select("id,name,role,phone,email,detail,client_id,created_at")
      .order("created_at", { ascending: false });

    if (q) query = query.ilike("name", `%${q}%`);
    if (clientId) query = query.eq("client_id", clientId);

    const { data: contacts, error } = await query;
    if (error) return new NextResponse("Error al cargar contactos", { status: 500 });

    const clientIds = Array.from(new Set((contacts || []).map((row) => row.client_id).filter(Boolean)));
    const clientMap = new Map<string, string>();
    if (clientIds.length) {
      const { data: clients } = await supabaseServer
        .from("crm_clients")
        .select("id,name")
        .in("id", clientIds);
      (clients || []).forEach((row) => clientMap.set(row.id, row.name));
    }

    const payload = (contacts || []).map((row) => ({
      ...row,
      client_name: row.client_id ? clientMap.get(row.client_id) || "-" : "-",
    }));

    return NextResponse.json({ contacts: payload });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al cargar contactos", { status: 500 });
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
      client_id: body?.client_id || null,
      role: body?.role ? String(body.role).trim() : null,
      phone: body?.phone ? String(body.phone).trim() : null,
      email: body?.email ? String(body.email).trim() : null,
      detail: body?.detail ? String(body.detail).trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from("crm_contacts")
      .insert(payload)
      .select("id,name,role,phone,email,detail,client_id,created_at")
      .maybeSingle();
    if (error) return new NextResponse("Error al crear contacto", { status: 500 });

    return NextResponse.json({ contact: data });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al crear contacto", { status: 500 });
  }
}
