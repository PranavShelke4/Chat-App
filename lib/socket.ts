import { Server as SocketServer } from "socket.io";
import { connectDB } from "./mongodb";
import { Room } from "../models/Room";
import { Message } from "../models/Message";
import { SOCKET_EVENTS } from "./socketEvents";
import { Member } from "../types";

const roomMembers = new Map<string, Member[]>();

export function initSocketHandlers(io: SocketServer) {
  io.on("connection", (socket) => {
    console.log("[socket] connected:", socket.id);

    socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ roomCode, userName }: { roomCode: string; userName: string }) => {
      await connectDB();

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const room = await Room.findOne({ code: roomCode, lastActivity: { $gte: sevenDaysAgo } });
      if (!room) { socket.emit("error", { message: "Room not found or expired" }); return; }

      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.userName = userName;

      const members = roomMembers.get(roomCode) ?? [];
      if (!members.find((m) => m.socketId === socket.id)) {
        members.push({ name: userName, socketId: socket.id, joinedAt: new Date().toISOString() });
        roomMembers.set(roomCode, members);
      }

      const messages = await Message.find({ roomCode })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("replyTo", "senderName content type deletedAt")
        .lean();

      socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
        messages: messages.reverse(),
        members,
        room: { code: room.code, name: room.name, adminName: room.adminName },
      });

      const systemMsg = await Message.create({
        roomCode,
        senderName: "system",
        type: "system",
        content: `${userName} joined the room`,
      });

      io.to(roomCode).emit(SOCKET_EVENTS.MEMBER_JOINED, { userName, members, systemMessage: systemMsg });
      await Room.updateOne({ code: roomCode }, { lastActivity: new Date() });
    });

    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (payload: {
      roomCode: string; senderName: string; type: string;
      content: string; fileName?: string; replyTo?: string;
    }) => {
      await connectDB();
      const msg = await Message.create({
        roomCode: payload.roomCode,
        senderName: payload.senderName,
        type: payload.type,
        content: payload.content,
        fileName: payload.fileName,
        replyTo: payload.replyTo || null,
        reactions: [],
        seenBy: [payload.senderName],
      });

      const populated = await Message.findById(msg._id)
        .populate("replyTo", "senderName content type deletedAt")
        .lean();

      io.to(payload.roomCode).emit(SOCKET_EVENTS.NEW_MESSAGE, populated);
      await Room.updateOne({ code: payload.roomCode }, { lastActivity: new Date() });
    });

    socket.on(SOCKET_EVENTS.TYPING_START, ({ roomCode, userName }: { roomCode: string; userName: string }) => {
      socket.to(roomCode).emit(SOCKET_EVENTS.TYPING_UPDATE, { userName, isTyping: true });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ roomCode, userName }: { roomCode: string; userName: string }) => {
      socket.to(roomCode).emit(SOCKET_EVENTS.TYPING_UPDATE, { userName, isTyping: false });
    });

    socket.on(SOCKET_EVENTS.ADD_REACTION, async ({ messageId, emoji, userName }: { messageId: string; emoji: string; userName: string }) => {
      await connectDB();
      const msg = await Message.findById(messageId);
      if (!msg) return;

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
      io.to(msg.roomCode).emit(SOCKET_EVENTS.REACTION_UPDATED, { messageId, reactions: msg.reactions });
    });

    socket.on(SOCKET_EVENTS.DELETE_MESSAGE, async ({ messageId, userName }: { messageId: string; userName: string }) => {
      await connectDB();
      const msg = await Message.findById(messageId);
      if (!msg || msg.senderName !== userName) return;
      msg.deletedAt = new Date();
      await msg.save();
      io.to(msg.roomCode).emit(SOCKET_EVENTS.MESSAGE_DELETED, { messageId });
    });

    socket.on(SOCKET_EVENTS.SEEN_MESSAGE, async ({ messageId, userName }: { messageId: string; userName: string }) => {
      await connectDB();
      await Message.updateOne({ _id: messageId, seenBy: { $ne: userName } }, { $push: { seenBy: userName } });
      const msg = await Message.findById(messageId, "seenBy roomCode").lean() as any;
      if (msg) io.to(msg.roomCode).emit(SOCKET_EVENTS.MESSAGE_SEEN, { messageId, seenBy: msg.seenBy });
    });

    socket.on("disconnect", async () => {
      const { roomCode, userName } = socket.data;
      if (!roomCode || !userName) return;

      const members = roomMembers.get(roomCode) ?? [];
      const updated = members.filter((m) => m.socketId !== socket.id);
      roomMembers.set(roomCode, updated);

      await connectDB();
      const systemMsg = await Message.create({
        roomCode,
        senderName: "system",
        type: "system",
        content: `${userName} left the room`,
      });
      io.to(roomCode).emit(SOCKET_EVENTS.MEMBER_LEFT, { userName, members: updated, systemMessage: systemMsg });
    });
  });
}
