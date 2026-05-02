import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";
import { Message } from "@/models/Message";
import { pusher, CHANNEL } from "@/lib/pusher";

export async function PATCH(req: NextRequest) {
  try {
    const { roomCode, oldName, newName } = await req.json();

    if (!roomCode || !oldName || !newName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    if (trimmedNew === oldName.trim()) {
      return NextResponse.json({ error: "Name is unchanged" }, { status: 400 });
    }

    await connectDB();

    const code = roomCode.toUpperCase();

    const room = await Room.findOne({ code });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Bulk-update senderName on all messages in this room
    await Message.updateMany(
      { roomCode: code, senderName: oldName },
      { $set: { senderName: trimmedNew } }
    );

    // Update oldName inside reactions[].names arrays
    await Message.collection.updateMany(
      { roomCode: code, "reactions.names": oldName },
      { $set: { "reactions.$[].names.$[elem]": trimmedNew } },
      { arrayFilters: [{ elem: { $eq: oldName } }] }
    );

    // Update oldName inside seenBy arrays
    await Message.collection.updateMany(
      { roomCode: code, seenBy: oldName },
      { $set: { "seenBy.$[elem]": trimmedNew } },
      { arrayFilters: [{ elem: { $eq: oldName } }] }
    );

    // Update room.adminName if the renamer is the admin
    if (room.adminName === oldName) {
      room.adminName = trimmedNew;
      await room.save();
    }

    await pusher.trigger(CHANNEL(code), "member-renamed", { oldName, newName: trimmedNew });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/rooms/rename]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
