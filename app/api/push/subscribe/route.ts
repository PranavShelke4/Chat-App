import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PushSubscription } from "@/models/PushSubscription";

export async function POST(req: NextRequest) {
  try {
    const { subscription, userName, roomCode } = await req.json();
    if (!subscription?.endpoint || !userName || !roomCode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    await PushSubscription.updateOne(
      { endpoint: subscription.endpoint, roomCode },
      {
        $set: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userName,
          roomCode,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
