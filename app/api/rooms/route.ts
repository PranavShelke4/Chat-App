import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { generateRoomCode } from "@/lib/roomCode";

export async function POST(req: NextRequest) {
  try {
    const { name, adminName } = await req.json();
    if (!name?.trim() || !adminName?.trim()) {
      return NextResponse.json({ error: "name and adminName are required" }, { status: 400 });
    }

    await connectDB();

    let code = generateRoomCode();
    let attempts = 0;
    while (await Room.exists({ code }) && attempts < 10) {
      code = generateRoomCode();
      attempts++;
    }

    const room = await Room.create({ code, name: name.trim(), adminName: adminName.trim() });
    return NextResponse.json({
      code: room.code,
      name: room.name,
      adminName: room.adminName,
      createdAt: room.createdAt,
    });
  } catch (err) {
    console.error("[POST /api/rooms]", err);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
    if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

    await connectDB();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const room = await Room.findOne({ code, lastActivity: { $gte: sevenDaysAgo } });

    if (!room) return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });

    return NextResponse.json({
      code: room.code,
      name: room.name,
      adminName: room.adminName,
      createdAt: room.createdAt,
    });
  } catch (err) {
    console.error("[GET /api/rooms]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
