import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "users", "admin")) return new NextResponse("Sin acceso", { status: 403 });

  try {
    const body = await req.json();
    const userId = params.id;
    const updates: Record<string, any> = {};

    if (body?.username) updates.username = String(body.username).trim();
    if (body?.displayName) updates.display_name = String(body.displayName).trim();
    if (typeof body?.isActive === "boolean") updates.is_active = body.isActive;
    if (body?.password) updates.password_hash = await bcrypt.hash(String(body.password), 10);

    if (Object.keys(updates).length) {
      const { error } = await supabaseServer.from("app_users").update(updates).eq("id", userId);
      if (error) return new NextResponse("Error al actualizar usuario", { status: 500 });
    }

    if (body?.roles) {
      await supabaseServer.from("user_roles").delete().eq("user_id", userId);
      const roleRows = Object.entries(body.roles)
        .filter(([, role]) => role === "admin" || role === "standard")
        .map(([app_key, role]) => ({
          user_id: userId,
          app_key,
          role,
        }));
      if (roleRows.length) {
        const { error: roleError } = await supabaseServer.from("user_roles").insert(roleRows);
        if (roleError) return new NextResponse("Error al asignar roles", { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al actualizar usuario", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "users", "admin")) return new NextResponse("Sin acceso", { status: 403 });

  try {
    const userId = params.id;
    await supabaseServer.from("app_sessions").delete().eq("user_id", userId);
    await supabaseServer.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabaseServer.from("app_users").delete().eq("id", userId);
    if (error) return new NextResponse("Error al eliminar usuario", { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al eliminar usuario", { status: 500 });
  }
}
