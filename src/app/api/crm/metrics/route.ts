import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("Endpoint obsoleto", { status: 410 });
}
