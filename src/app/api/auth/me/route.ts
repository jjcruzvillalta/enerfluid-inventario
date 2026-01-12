import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) return new NextResponse("No autenticado", { status: 401 });
  return NextResponse.json(session);
}
