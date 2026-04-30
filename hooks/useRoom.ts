"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { MessageDoc, Member, RoomDoc } from "@/types";

interface UseRoomOptions {
  roomCode: string;
  userName: string;
  password?: string;
}

export function useRoom({ roomCode, userName, password }: UseRoomOptions) {
  const socket = useSocket();
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode, userName, password });

    const onRoomJoined = ({ messages: msgs, members: mems, room: r }: any) => {
      setMessages(msgs);
      setMembers(mems);
      setRoom(r);
      setConnected(true);
      setRoomError(null);
    };

    const onRoomError = ({ message }: { message: string }) => {
      setRoomError(message);
    };

    const onNewMessage = (msg: MessageDoc) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onMemberJoined = ({ members: mems, systemMessage }: any) => {
      setMembers(mems);
      if (systemMessage) setMessages((prev) => [...prev, systemMessage]);
    };

    const onMemberLeft = ({ members: mems, systemMessage }: any) => {
      setMembers(mems);
      if (systemMessage) setMessages((prev) => [...prev, systemMessage]);
    };

    const onTypingUpdate = ({ userName: u, isTyping }: { userName: string; isTyping: boolean }) => {
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
    };

    const onReactionUpdated = ({ messageId, reactions }: any) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const onMessageDeleted = ({ messageId }: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m
        )
      );
    };

    const onMessageSeen = ({ messageId, seenBy }: any) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, seenBy } : m))
      );
    };

    socket.on(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
    socket.on(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
    socket.on(SOCKET_EVENTS.MEMBER_JOINED, onMemberJoined);
    socket.on(SOCKET_EVENTS.MEMBER_LEFT, onMemberLeft);
    socket.on(SOCKET_EVENTS.TYPING_UPDATE, onTypingUpdate);
    socket.on(SOCKET_EVENTS.REACTION_UPDATED, onReactionUpdated);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, onMessageSeen);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
      socket.off(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
      socket.off(SOCKET_EVENTS.MEMBER_JOINED, onMemberJoined);
      socket.off(SOCKET_EVENTS.MEMBER_LEFT, onMemberLeft);
      socket.off(SOCKET_EVENTS.TYPING_UPDATE, onTypingUpdate);
      socket.off(SOCKET_EVENTS.REACTION_UPDATED, onReactionUpdated);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted);
      socket.off(SOCKET_EVENTS.MESSAGE_SEEN, onMessageSeen);
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode, userName });
    };
  }, [roomCode, userName, password]);

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
    roomError,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    addReaction,
    deleteMessage,
    markSeen,
  };
}
