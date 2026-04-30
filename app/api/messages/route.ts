import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { Message } from "@/models/Message";
import { pusher, CHANNEL } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { roomCode, senderName, type, content, fileName, replyTo } = await req.json();
    if (!roomCode || !senderName || !type || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const msg = await Message.create({
      roomCode,
      senderName,
      type,
      content,
      fileName,
      replyTo: replyTo || null,
      reactions: [],
      seenBy: [senderName],
    });

    const populated = await Message.findById(msg._id)
      .populate("replyTo", "senderName content type deletedAt")
      .lean();

    await Room.updateOne({ code: roomCode }, { lastActivity: new Date() });
    await pusher.trigger(CHANNEL(roomCode), "new-message", populated);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/messages]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
