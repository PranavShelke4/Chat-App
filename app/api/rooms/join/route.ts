import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { Message } from "@/models/Message";

export async function POST(req: NextRequest) {
  try {
    const { roomCode, userName, password } = await req.json();
    if (!roomCode || !userName) {
      return NextResponse.json({ error: "roomCode and userName are required" }, { status: 400 });
    }

    await connectDB();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const room = await Room.findOne({ code: roomCode.toUpperCase(), lastActivity: { $gte: sevenDaysAgo } });

    if (!room) {
      return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
    }

    if (room.password && room.password !== password && userName !== room.adminName) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    if (room.locked && userName !== room.adminName) {
      return NextResponse.json({ error: "Room is locked. Ask the admin to unlock it." }, { status: 403 });
    }

    const messages = await Message.find({ roomCode: room.code })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("replyTo", "senderName content type deletedAt")
      .lean();

    await Room.updateOne({ code: room.code }, { lastActivity: new Date() });

    return NextResponse.json({
      room: {
        code: room.code,
        name: room.name,
        adminName: room.adminName,
        passwordProtected: !!room.password,
        locked: room.locked,
      },
      messages: messages.reverse(),
    });
  } catch (err) {
    console.error("[POST /api/rooms/join]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
