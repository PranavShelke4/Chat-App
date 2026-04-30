import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";

export async function POST(req: NextRequest) {
  try {
    const { code, password } = await req.json();
    if (!code || !password) {
      return NextResponse.json({ error: "code and password are required" }, { status: 400 });
    }

    await connectDB();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const room = await Room.findOne({
      code: code.toUpperCase(),
      lastActivity: { $gte: sevenDaysAgo },
    });

    if (!room) return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });

    if (room.password && room.password !== password) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error("[POST /api/rooms/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
