import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

const CONFIG_MAP: Record<
  string,
  {
    table: string;
    fields: string[];
    adminFields: string[];
  }
> = {
  "client-types": {
    table: "crm_client_types",
    fields: ["id", "name", "is_active", "sort_order"],
    adminFields: ["name", "is_active", "sort_order"],
  },
  "activity-types": {
    table: "crm_activity_types",
    fields: ["id", "name", "is_active", "sort_order"],
    adminFields: ["name", "is_active", "sort_order"],
  },
  "activity-outcomes": {
    table: "crm_activity_outcomes",
    fields: ["id", "name", "is_active", "is_effective", "sort_order"],
    adminFields: ["name", "is_active", "is_effective", "sort_order"],
  },
  "opportunity-stages": {
    table: "crm_opportunity_stages",
    fields: ["id", "name", "is_active", "is_won", "is_lost", "sort_order"],
    adminFields: ["name", "is_active", "is_won", "is_lost", "sort_order"],
  },
};

const getConfig = (kind: string) => CONFIG_MAP[kind];

export async function GET(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const kind = String(searchParams.get("kind") || "").trim();
  const config = getConfig(kind);
  if (!config) return new NextResponse("Configuracion invalida", { status: 400 });

  const { data, error } = await supabaseServer
    .from(config.table)
    .select(config.fields.join(","))
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return new NextResponse("Error al cargar configuracion", { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "admin")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const kind = String(searchParams.get("kind") || "").trim();
  const config = getConfig(kind);
  if (!config) return new NextResponse("Configuracion invalida", { status: 400 });

  const body = await req.json();
  const payload: Record<string, any> = {};
  config.adminFields.forEach((field) => {
    if (body?.[field] !== undefined) payload[field] = body[field];
  });
  if (!payload.name) return new NextResponse("Nombre requerido", { status: 400 });
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from(config.table)
    .insert(payload)
    .select(config.fields.join(","))
    .maybeSingle();

  if (error) return new NextResponse("Error al crear configuracion", { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "admin")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const kind = String(searchParams.get("kind") || "").trim();
  const id = String(searchParams.get("id") || "").trim();
  const config = getConfig(kind);
  if (!config || !id) return new NextResponse("Configuracion invalida", { status: 400 });

  const body = await req.json();
  const updates: Record<string, any> = {};
  config.adminFields.forEach((field) => {
    if (body?.[field] !== undefined) updates[field] = body[field];
  });
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from(config.table)
    .update(updates)
    .eq("id", id)
    .select(config.fields.join(","))
    .maybeSingle();

  if (error) return new NextResponse("Error al actualizar configuracion", { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "admin")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const kind = String(searchParams.get("kind") || "").trim();
  const id = String(searchParams.get("id") || "").trim();
  const config = getConfig(kind);
  if (!config || !id) return new NextResponse("Configuracion invalida", { status: 400 });

  const { error } = await supabaseServer.from(config.table).delete().eq("id", id);
  if (error) return new NextResponse("Error al eliminar configuracion", { status: 500 });
  return NextResponse.json({ ok: true });
}
