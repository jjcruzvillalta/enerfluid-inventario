import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

const startOfIsoWeek = (date: Date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() - day + 1);
  return temp;
};

const isoWeekKey = (date: Date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${temp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export async function GET(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedUserId = String(searchParams.get("userId") || "").trim();
  const isAdmin = hasAccess(session.roles, "crm", "admin");
  const filterUserId = requestedUserId && (isAdmin || requestedUserId === session.user.id) ? requestedUserId : "";

  const now = new Date();
  const currentWeekStart = startOfIsoWeek(now);
  const weekBuckets = Array.from({ length: 12 }).map((_value, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - (11 - index) * 7);
    return { key: isoWeekKey(weekStart), start: weekStart };
  });
  const weekKeys = weekBuckets.map((bucket) => bucket.key);
  const earliestWeek = weekBuckets[0]?.start || currentWeekStart;

  const monthBuckets = Array.from({ length: 12 }).map((_value, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return { key: monthKey(date), start: date };
  });
  const monthKeys = monthBuckets.map((bucket) => bucket.key);
  const earliestMonth = monthBuckets[0]?.start || new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const [typesRes, outcomesRes, stagesRes] = await Promise.all([
      supabaseServer.from("crm_activity_types").select("id,name").order("sort_order", { ascending: true }),
      supabaseServer
        .from("crm_activity_outcomes")
        .select("id,name,is_effective")
        .order("sort_order", { ascending: true }),
      supabaseServer.from("crm_opportunity_stages").select("id,name,is_won"),
    ]);

    if (typesRes.error || outcomesRes.error || stagesRes.error) {
      return new NextResponse("Error al cargar configuracion", { status: 500 });
    }

    let activitiesQuery = supabaseServer
      .from("crm_activities")
      .select("id,activity_type_id,outcome_id,responsible_user_id,scheduled_at,client_id")
      .gte("scheduled_at", earliestWeek.toISOString());
    if (filterUserId) activitiesQuery = activitiesQuery.eq("responsible_user_id", filterUserId);

    const { data: activities, error: activitiesError } = await activitiesQuery;
    if (activitiesError) return new NextResponse("Error al cargar actividades", { status: 500 });

    const typeMap = new Map((typesRes.data || []).map((row) => [row.id, row.name]));
    const outcomeMap = new Map((outcomesRes.data || []).map((row) => [row.id, row]));

    const typesList = (typesRes.data || []).map((row) => ({ id: row.id, name: row.name }));
    const ensureTypeId = (id?: string | null) => (id && typeMap.has(id) ? id : "sin_tipo");

    const baseCounts: Record<string, number[]> = {};
    const effectiveCounts: Record<string, number[]> = {};
    [...typesList.map((row) => row.id), "sin_tipo"].forEach((typeId) => {
      baseCounts[typeId] = Array(weekKeys.length).fill(0);
      effectiveCounts[typeId] = Array(weekKeys.length).fill(0);
    });

    (activities || []).forEach((activity) => {
      if (!activity.scheduled_at) return;
      const date = new Date(activity.scheduled_at);
      if (Number.isNaN(date.getTime())) return;
      const weekKey = isoWeekKey(date);
      const weekIndex = weekKeys.indexOf(weekKey);
      if (weekIndex === -1) return;
      const typeId = ensureTypeId(activity.activity_type_id);
      baseCounts[typeId][weekIndex] += 1;
      const outcome = activity.outcome_id ? outcomeMap.get(activity.outcome_id) : null;
      if (outcome?.is_effective) effectiveCounts[typeId][weekIndex] += 1;
    });

    const activitiesByWeek = {
      labels: weekKeys,
      datasets: Object.entries(baseCounts).map(([typeId, data]) => ({
        label: typeId === "sin_tipo" ? "Sin tipo" : typeMap.get(typeId) || "Sin tipo",
        data,
      })),
    };

    const effectiveActivitiesByWeek = {
      labels: weekKeys,
      datasets: Object.entries(effectiveCounts).map(([typeId, data]) => ({
        label: typeId === "sin_tipo" ? "Sin tipo" : typeMap.get(typeId) || "Sin tipo",
        data,
      })),
    };

    const wonStageIds = (stagesRes.data || []).filter((row) => row.is_won).map((row) => row.id);
    let wonOpps: any[] = [];
    if (wonStageIds.length) {
      let oppQuery = supabaseServer
        .from("crm_opportunities")
        .select("id,client_id,responsible_user_id,closed_at")
        .in("stage_id", wonStageIds)
        .gte("closed_at", earliestMonth.toISOString());
      if (filterUserId) oppQuery = oppQuery.eq("responsible_user_id", filterUserId);

      const { data: oppRows, error: oppError } = await oppQuery;
      if (oppError) return new NextResponse("Error al cargar oportunidades", { status: 500 });
      wonOpps = oppRows || [];
    }

    const wonByMonth = Array(monthKeys.length).fill(0);
    const clientCounts = new Map<string, number>();
    (wonOpps || []).forEach((opp) => {
      if (!opp.closed_at) return;
      const date = new Date(opp.closed_at);
      if (Number.isNaN(date.getTime())) return;
      const key = monthKey(date);
      const index = monthKeys.indexOf(key);
      if (index === -1) return;
      wonByMonth[index] += 1;
      if (opp.client_id) clientCounts.set(opp.client_id, (clientCounts.get(opp.client_id) || 0) + 1);
    });

    const clientIds = Array.from(clientCounts.keys());
    const clientsRes = clientIds.length
      ? await supabaseServer.from("crm_clients").select("id,name").in("id", clientIds)
      : { data: [] };
    const clientMap = new Map((clientsRes.data || []).map((row) => [row.id, row.name]));

    const topEntries = Array.from(clientCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const topLabels = topEntries.map(([id]) => clientMap.get(id) || "Sin cliente");
    const topValues = topEntries.map((entry) => entry[1]);
    const othersTotal = Array.from(clientCounts.entries())
      .slice(10)
      .reduce((sum, entry) => sum + entry[1], 0);
    if (othersTotal > 0) {
      topLabels.push("Otros");
      topValues.push(othersTotal);
    }

    let recentQuery = supabaseServer
      .from("crm_activities")
      .select("id,activity_type_id,outcome_id,client_id,responsible_user_id,scheduled_at,detail")
      .order("scheduled_at", { ascending: false })
      .limit(10);
    if (filterUserId) recentQuery = recentQuery.eq("responsible_user_id", filterUserId);
    const { data: recentActivities } = await recentQuery;

    const recentClientIds = Array.from(new Set((recentActivities || []).map((row) => row.client_id).filter(Boolean)));
    const recentUserIds = Array.from(
      new Set((recentActivities || []).map((row) => row.responsible_user_id).filter(Boolean))
    );
    const recentTypeIds = Array.from(
      new Set((recentActivities || []).map((row) => row.activity_type_id).filter(Boolean))
    );
    const recentOutcomeIds = Array.from(
      new Set((recentActivities || []).map((row) => row.outcome_id).filter(Boolean))
    );

    const [recentClientsRes, recentUsersRes, recentTypesRes, recentOutcomesRes] = await Promise.all([
      recentClientIds.length
        ? supabaseServer.from("crm_clients").select("id,name").in("id", recentClientIds)
        : Promise.resolve({ data: [] }),
      recentUserIds.length
        ? supabaseServer.from("app_users").select("id,display_name,username").in("id", recentUserIds)
        : Promise.resolve({ data: [] }),
      recentTypeIds.length
        ? supabaseServer.from("crm_activity_types").select("id,name").in("id", recentTypeIds)
        : Promise.resolve({ data: [] }),
      recentOutcomeIds.length
        ? supabaseServer.from("crm_activity_outcomes").select("id,name").in("id", recentOutcomeIds)
        : Promise.resolve({ data: [] }),
    ]);

    const recentClientMap = new Map((recentClientsRes.data || []).map((row) => [row.id, row.name]));
    const recentUserMap = new Map(
      (recentUsersRes.data || []).map((row) => [row.id, row.display_name || row.username])
    );
    const recentTypeMap = new Map((recentTypesRes.data || []).map((row) => [row.id, row.name]));
    const recentOutcomeMap = new Map((recentOutcomesRes.data || []).map((row) => [row.id, row.name]));

    const recentRows = (recentActivities || []).map((row) => ({
      ...row,
      client_name: row.client_id ? recentClientMap.get(row.client_id) || "-" : "-",
      responsible_name: row.responsible_user_id ? recentUserMap.get(row.responsible_user_id) || "-" : "-",
      type_name: row.activity_type_id ? recentTypeMap.get(row.activity_type_id) || "-" : "-",
      outcome_name: row.outcome_id ? recentOutcomeMap.get(row.outcome_id) || "-" : "-",
    }));

    return NextResponse.json({
      activitiesByWeek,
      effectiveActivitiesByWeek,
      wonOpportunitiesByMonth: { labels: monthKeys, data: wonByMonth },
      topClients: { labels: topLabels, values: topValues },
      recentActivities: recentRows,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al cargar analisis", { status: 500 });
  }
}
