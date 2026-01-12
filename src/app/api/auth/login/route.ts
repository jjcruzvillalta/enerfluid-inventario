import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabase/server";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!username || !password) {
      return new NextResponse("Credenciales incompletas", { status: 400 });
    }

    const { data: user, error } = await supabaseServer
      .from("app_users")
      .select("id,username,display_name,password_hash,is_active")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) return new NextResponse("Usuario o clave incorrecta", { status: 401 });
    if (!user.is_active) return new NextResponse("Usuario deshabilitado", { status: 403 });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return new NextResponse("Usuario o clave incorrecta", { status: 401 });

    await createSession(user.id);

    const { data: rolesRows } = await supabaseServer
      .from("user_roles")
      .select("app_key,role")
      .eq("user_id", user.id);

    const roles: Record<string, string> = {};
    (rolesRows || []).forEach((row) => {
      roles[row.app_key] = row.role;
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name || user.username,
      },
      roles,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al iniciar sesion", { status: 500 });
  }
}
