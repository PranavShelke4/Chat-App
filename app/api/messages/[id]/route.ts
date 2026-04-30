import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { pusher, CHANNEL } from "@/lib/pusher";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userName } = await req.json();

    await connectDB();
    const msg = await Message.findById(id);
    if (!msg || msg.senderName !== userName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    msg.deletedAt = new Date();
    await msg.save();

    await pusher.trigger(CHANNEL(msg.roomCode), "message-deleted", { messageId: id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/messages/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
