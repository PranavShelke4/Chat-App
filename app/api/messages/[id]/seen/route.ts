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
    const { userName } = await req.json();

    // System messages use synthetic IDs that are not MongoDB ObjectIds
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ ok: true });
    }

    await connectDB();
    await Message.updateOne(
      { _id: id, seenBy: { $ne: userName } },
      { $push: { seenBy: userName } }
    );
    const msg = await Message.findById(id, "seenBy roomCode").lean() as any;
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await pusher.trigger(CHANNEL(msg.roomCode), "message-seen", {
      messageId: id,
      seenBy: msg.seenBy,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/messages/[id]/seen]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
