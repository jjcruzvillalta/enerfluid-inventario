import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionFromRequest, hasAccess } from "@/lib/auth";

const mentionRegex = /@([A-Za-z0-9._-]+)/g;

const extractMentions = (text: string) => {
  const matches = new Set<string>();
  if (!text) return [];
  let match: RegExpExecArray | null = null;
  while ((match = mentionRegex.exec(text)) !== null) {
    if (match[1]) matches.add(match[1].toLowerCase());
  }
  return Array.from(matches.values());
};

const pickTarget = (body: any) => ({
  client_id: body?.client_id || null,
  contact_id: body?.contact_id || null,
  opportunity_id: body?.opportunity_id || null,
  activity_id: body?.activity_id || null,
});

const countTargets = (targets: Record<string, any>) =>
  Object.values(targets).filter((value) => value).length;

export async function POST(req: Request) {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  if (!hasAccess(session.roles, "crm", "standard")) {
    return new NextResponse("Sin acceso", { status: 403 });
  }

  try {
    const body = await req.json();
    const detail = String(body?.detail || "").trim();
    if (!detail) return new NextResponse("Detalle requerido", { status: 400 });

    let targets = pickTarget(body);
    if (countTargets(targets) !== 1) {
      return new NextResponse("Debe asociarse a una sola entidad", { status: 400 });
    }

    if (body?.parent_note_id) {
      const { data: parent } = await supabaseServer
        .from("crm_notes")
        .select("client_id,contact_id,opportunity_id,activity_id")
        .eq("id", body.parent_note_id)
        .maybeSingle();
      if (!parent) return new NextResponse("Nota padre no encontrada", { status: 400 });

      const parentTargets = {
        client_id: parent.client_id || null,
        contact_id: parent.contact_id || null,
        opportunity_id: parent.opportunity_id || null,
        activity_id: parent.activity_id || null,
      };
      if (countTargets(parentTargets) !== 1) {
        return new NextResponse("Nota padre invalida", { status: 400 });
      }

      const incomingTargets = pickTarget(body);
      const hasMismatch = Object.keys(parentTargets).some((key) => {
        const parentValue = (parentTargets as any)[key];
        const incomingValue = (incomingTargets as any)[key];
        return incomingValue && parentValue && incomingValue !== parentValue;
      });

      if (hasMismatch) {
        return new NextResponse("La nota debe pertenecer a la misma entidad", { status: 400 });
      }

      targets = parentTargets;
    }

    const payload = {
      detail,
      author_user_id: session.user.id,
      parent_note_id: body?.parent_note_id || null,
      ...targets,
      updated_at: new Date().toISOString(),
    };

    const { data: note, error } = await supabaseServer
      .from("crm_notes")
      .insert(payload)
      .select("id,detail,author_user_id,parent_note_id,client_id,contact_id,opportunity_id,activity_id,created_at")
      .maybeSingle();
    if (error || !note) return new NextResponse("Error al crear nota", { status: 500 });

    const mentions = extractMentions(detail);
    if (mentions.length) {
      const { data: users } = await supabaseServer
        .from("app_users")
        .select("id,username")
        .in("username", mentions);

      const mentionsRows = (users || [])
        .filter((user) => user.id !== session.user.id)
        .map((user) => ({
          note_id: note.id,
          mentioned_user_id: user.id,
        }));

      if (mentionsRows.length) {
        await supabaseServer.from("crm_note_mentions").insert(mentionsRows);
        const notifications = mentionsRows.map((row) => ({
          user_id: row.mentioned_user_id,
          note_id: note.id,
          actor_user_id: session.user.id,
          type: "mention",
          is_read: false,
        }));
        await supabaseServer.from("crm_notifications").insert(notifications);
      }
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error al crear nota", { status: 500 });
  }
}
