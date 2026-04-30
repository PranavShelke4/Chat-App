import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { Message } from "@/models/Message";
import { PushSubscription } from "@/models/PushSubscription";
import { pusher, CHANNEL } from "@/lib/pusher";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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

    const [room] = await Promise.all([
      Room.findOne({ code: roomCode }, "name").lean(),
      Room.updateOne({ code: roomCode }, { lastActivity: new Date() }),
      pusher.trigger(CHANNEL(roomCode), "new-message", populated),
    ]);

    const roomName = (room as any)?.name ?? roomCode;
    const preview =
      type === "text" ? content.slice(0, 100) : "📎 Sent a file";

    const subs = await PushSubscription.find({
      roomCode,
      userName: { $ne: senderName },
    }).lean();

    if (subs.length > 0) {
      const payload = JSON.stringify({
        title: roomName,
        body: `${senderName}: ${preview}`,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/room/${roomCode}`,
        tag: `room-${roomCode}`,
      });

      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            );
          } catch (err: any) {
            if (err?.statusCode === 410) {
              await PushSubscription.deleteOne({ endpoint: sub.endpoint });
            }
          }
        })
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/messages]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
