import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

const TABLE_MAP: Record<string, string> = {
  movimientos: "movimientos",
  ventas: "ventas",
  items: "listado_items",
  catalogo: "catalogo_items",
};

export async function POST(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "inventory", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const body = await req.json();
    const type = String(body?.type || "");
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    const replace = Boolean(body?.replace);
    const fileName = body?.fileName ? String(body.fileName) : "";
    const isLast = Boolean(body?.isLast);
    const totalRows = Number.isFinite(body?.totalRows) ? Number(body.totalRows) : rows.length;

    const table = TABLE_MAP[type];
    if (!table) return new NextResponse("Tipo invalido", { status: 400 });
    if (!rows.length) return new NextResponse("Sin filas", { status: 400 });

    if (replace) {
      const { error: deleteError } = await supabaseServer.from(table).delete().neq("id", 0);
      if (deleteError) throw deleteError;
    }

    const { error: insertError } = await supabaseServer.from(table).insert(rows);
    if (insertError) throw insertError;

    if (isLast) {
      const { error: logError } = await supabaseServer.from("upload_logs").insert({
        type,
        row_count: totalRows,
        file_name: fileName || null,
      });
      if (logError) console.error("upload_logs", logError);
    }

    return NextResponse.json({ inserted: rows.length });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al guardar datos", { status: 500 });
  }
}
