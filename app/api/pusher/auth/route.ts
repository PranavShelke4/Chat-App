import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");
  const userName = params.get("userName") || "Anonymous";

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  const auth = pusher.authorizeChannel(socketId, channelName, {
    user_id: socketId,
    user_info: { name: userName },
  });

  return NextResponse.json(auth);
}
