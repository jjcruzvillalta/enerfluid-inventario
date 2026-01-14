import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  const { data: roles, error: rolesError } = await supabaseServer
    .from("user_roles")
    .select("user_id,role")
    .eq("app_key", "crm");
  if (rolesError) return new NextResponse("Error al cargar usuarios", { status: 500 });

  const userIds = Array.from(new Set((roles || []).map((row) => row.user_id)));
  if (!userIds.length) return NextResponse.json({ users: [] });

  const { data: users, error: usersError } = await supabaseServer
    .from("app_users")
    .select("id,username,display_name,is_active")
    .in("id", userIds)
    .order("display_name", { ascending: true });
  if (usersError) return new NextResponse("Error al cargar usuarios", { status: 500 });

  const roleMap = new Map<string, string>();
  (roles || []).forEach((row) => roleMap.set(row.user_id, row.role));

  const payload = (users || [])
    .filter((user) => user.is_active !== false)
    .map((user) => ({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: roleMap.get(user.id) || "none",
    }));

  return NextResponse.json({ users: payload });
}
