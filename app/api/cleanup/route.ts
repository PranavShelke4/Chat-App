import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredRooms } from "@/lib/cleanup";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await cleanupExpiredRooms();
  return NextResponse.json({ ok: true });
}
