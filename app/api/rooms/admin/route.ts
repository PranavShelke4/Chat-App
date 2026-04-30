import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function verifyAdmin(code: string, adminName: string) {
  await connectDB();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const room = await Room.findOne({ code: code.toUpperCase(), lastActivity: { $gte: sevenDaysAgo } });
  if (!room) return null;
  if (room.adminName !== adminName) return null;
  return room;
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code") ?? "";
    const adminName = req.nextUrl.searchParams.get("adminName") ?? "";
    const room = await verifyAdmin(code, adminName);
    if (!room) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    return NextResponse.json({ password: room.password, locked: room.locked });
  } catch (err) {
    console.error("[GET /api/rooms/admin]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { code, adminName, rotateOtp, locked } = await req.json();
    const room = await verifyAdmin(code, adminName);
    if (!room) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const update: Record<string, unknown> = {};
    if (rotateOtp) update.password = generateOTP();
    if (locked !== undefined) update.locked = locked;

    await Room.updateOne({ code: room.code }, { $set: update });

    return NextResponse.json({
      password: rotateOtp ? update.password : room.password,
      locked: locked !== undefined ? locked : room.locked,
    });
  } catch (err) {
    console.error("[PATCH /api/rooms/admin]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
