import { connectDB } from "./mongodb";
import { Room } from "../models/Room";
import { Message } from "../models/Message";

export async function cleanupExpiredRooms() {
  await connectDB();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const expired = await Room.find(
    { lastActivity: { $lt: sevenDaysAgo } },
    "code"
  ).lean() as any[];

  if (expired.length === 0) return;

  const codes = expired.map((r: any) => r.code);
  await Message.deleteMany({ roomCode: { $in: codes } });
  await Room.deleteMany({ lastActivity: { $lt: sevenDaysAgo } });
  console.log(`[cleanup] Removed ${expired.length} expired rooms`);
}
