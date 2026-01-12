import crypto from "crypto";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

const COOKIE_NAME = "ef_session";
const SESSION_DAYS = 7;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const createSession = async (userId: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await supabaseServer.from("app_sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw error;

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
};

export const destroySession = async () => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await supabaseServer.from("app_sessions").delete().eq("token_hash", tokenHash);
  }
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
};

export const getSessionFromRequest = async () => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const { data: sessionRow, error } = await supabaseServer
    .from("app_sessions")
    .select("id,user_id,expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !sessionRow) return null;
  if (sessionRow.expires_at && new Date(sessionRow.expires_at) < new Date()) {
    await supabaseServer.from("app_sessions").delete().eq("id", sessionRow.id);
    return null;
  }

  const { data: user } = await supabaseServer
    .from("app_users")
    .select("id,username,display_name,is_active")
    .eq("id", sessionRow.user_id)
    .maybeSingle();
  if (!user || !user.is_active) return null;

  const { data: rolesRows } = await supabaseServer
    .from("user_roles")
    .select("app_key,role")
    .eq("user_id", user.id);

  const roles: Record<string, string> = {};
  (rolesRows || []).forEach((row) => {
    roles[row.app_key] = row.role;
  });

  return { user, roles };
};

export const hasAccess = (roles: Record<string, string>, appKey: string, required = "standard") => {
  const role = roles?.[appKey];
  if (!role) return false;
  if (role === "admin") return true;
  return required === "standard" && role === "standard";
};
