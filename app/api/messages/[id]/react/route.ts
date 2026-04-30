import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { pusher, CHANNEL } from "@/lib/pusher";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { emoji, userName } = await req.json();

    await connectDB();
    const msg = await Message.findById(id);
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = msg.reactions.find((r: any) => r.emoji === emoji);
    if (existing) {
      const idx = existing.names.indexOf(userName);
      if (idx >= 0) existing.names.splice(idx, 1);
      else existing.names.push(userName);
      if (existing.names.length === 0) {
        msg.reactions = msg.reactions.filter((r: any) => r.emoji !== emoji);
      }
    } else {
      msg.reactions.push({ emoji, names: [userName] });
    }
    await msg.save();

    await pusher.trigger(CHANNEL(msg.roomCode), "reaction-updated", {
      messageId: id,
      reactions: msg.reactions,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/messages/[id]/react]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
