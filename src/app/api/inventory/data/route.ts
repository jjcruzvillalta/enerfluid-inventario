import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

const TABLES = {
  movements: "movimientos",
  ventas: "ventas",
  items: "listado_items",
  catalogo: "catalogo_items",
};

const fetchAllRows = async (table: string) => {
  const pageSize = 1000;
  let from = 0;
  let allRows: any[] = [];
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabaseServer.from(table).select("*").range(from, from + pageSize - 1);
    if (error) throw error;
    allRows = allRows.concat(data || []);
    if (!data || data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
    }
  }
  return allRows;
};

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "inventory", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const { data: logsData, error: logsError } = await supabaseServer
      .from("upload_logs")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(1000);

    if (logsError && logsError.code !== "42P01") throw logsError;
    const logs = logsData || [];

    const [movRows, ventasRows, itemsRows, catalogRows] = await Promise.all([
      fetchAllRows(TABLES.movements),
      fetchAllRows(TABLES.ventas),
      fetchAllRows(TABLES.items),
      fetchAllRows(TABLES.catalogo),
    ]);

    return NextResponse.json({
      movRows,
      ventasRows,
      itemsRows,
      catalogRows,
      uploadLogs: logs,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al cargar datos", { status: 500 });
  }
}
