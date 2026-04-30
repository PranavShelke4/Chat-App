"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { MessageDoc, Member, RoomDoc } from "@/types";

interface UseRoomOptions {
  roomCode: string;
  userName: string;
}

export function useRoom({ roomCode, userName }: UseRoomOptions) {
  const socket = useSocket();
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, userName });

    socket.on(SOCKET_EVENTS.ROOM_JOINED, ({ messages: msgs, members: mems, room: r }) => {
      setMessages(msgs);
      setMembers(mems);
      setRoom(r);
      setConnected(true);
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg: MessageDoc) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on(SOCKET_EVENTS.MEMBER_JOINED, ({ members: mems, systemMessage }) => {
      setMembers(mems);
      if (systemMessage) setMessages((prev) => [...prev, systemMessage]);
    });

    socket.on(SOCKET_EVENTS.MEMBER_LEFT, ({ members: mems, systemMessage }) => {
      setMembers(mems);
      if (systemMessage) setMessages((prev) => [...prev, systemMessage]);
    });

    socket.on(SOCKET_EVENTS.TYPING_UPDATE, ({ userName: u, isTyping }: { userName: string; isTyping: boolean }) => {
      const timer = typingTimers.current.get(u);
      if (timer) clearTimeout(timer);

      if (isTyping) {
        setTypingUsers((prev) => (prev.includes(u) ? prev : [...prev, u]));
        const t = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== u));
          typingTimers.current.delete(u);
        }, 3000);
        typingTimers.current.set(u, t);
      } else {
        setTypingUsers((prev) => prev.filter((n) => n !== u));
      }
    });

    socket.on(SOCKET_EVENTS.REACTION_UPDATED, ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m
        )
      );
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, ({ messageId, seenBy }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, seenBy } : m))
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_JOINED);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.MEMBER_JOINED);
      socket.off(SOCKET_EVENTS.MEMBER_LEFT);
      socket.off(SOCKET_EVENTS.TYPING_UPDATE);
      socket.off(SOCKET_EVENTS.REACTION_UPDATED);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED);
      socket.off(SOCKET_EVENTS.MESSAGE_SEEN);
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode, userName });
    };
  }, [roomCode, userName]);

  const sendMessage = useCallback(
    (payload: { type: string; content: string; fileName?: string; replyTo?: string }) => {
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { roomCode, senderName: userName, ...payload });
    },
    [socket, roomCode, userName]
  );

  const sendTypingStart = useCallback(() => {
    socket.emit(SOCKET_EVENTS.TYPING_START, { roomCode, userName });
  }, [socket, roomCode, userName]);

  const sendTypingStop = useCallback(() => {
    socket.emit(SOCKET_EVENTS.TYPING_STOP, { roomCode, userName });
  }, [socket, roomCode, userName]);

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      socket.emit(SOCKET_EVENTS.ADD_REACTION, { messageId, emoji, userName });
    },
    [socket, userName]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      socket.emit(SOCKET_EVENTS.DELETE_MESSAGE, { messageId, userName });
    },
    [socket, userName]
  );

  const markSeen = useCallback(
    (messageId: string) => {
      socket.emit(SOCKET_EVENTS.SEEN_MESSAGE, { messageId, userName });
    },
    [socket, userName]
  );

  return {
    room,
    messages,
    members,
    typingUsers,
    connected,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    addReaction,
    deleteMessage,
    markSeen,
  };
}
