import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { pusher, CHANNEL } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { roomCode, targetName, adminName } = await req.json();

    await connectDB();
    const room = await Room.findOne({ code: roomCode?.toUpperCase() });
    if (!room || room.adminName !== adminName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pusher.trigger(CHANNEL(roomCode), "member-kicked", { targetName });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/rooms/kick]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
