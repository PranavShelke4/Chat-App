"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PusherClient from "pusher-js";
import { MessageDoc, Member, RoomDoc } from "@/types";

function makeSystemMsg(roomCode: string, content: string): MessageDoc {
  return {
    _id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    roomCode,
    senderName: "system",
    type: "system" as const,
    content,
    reactions: [],
    seenBy: [],
    createdAt: new Date().toISOString(),
  };
}

interface UseRoomOptions {
  roomCode: string;
  userName: string;
  password?: string;
}

export function useRoom({ roomCode, userName: initialUserName, password }: UseRoomOptions) {
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [kicked, setKicked] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(initialUserName);

  const userNameRef = useRef(initialUserName);
  const pusherRef = useRef<PusherClient | null>(null);
  const channelRef = useRef<any>(null);
  const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const kickedNames = useRef<Set<string>>(new Set());

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, userName: initialUserName, password }),
      });
      const data = await res.json();
      if (cancelled) return;

      if (!res.ok) {
        setRoomError(data.error || "Failed to join room");
        return;
      }

      setRoom(data.room);
      setMessages(data.messages);

      const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        channelAuthorization: {
          endpoint: "/api/pusher/auth",
          transport: "ajax",
          params: { userName: initialUserName },
        },
      });
      pusherRef.current = pusher;

      const channel = pusher.subscribe(`presence-room-${roomCode}`);
      channelRef.current = channel;

      channel.bind("pusher:subscription_succeeded", (members: any) => {
        if (cancelled) return;
        const list: Member[] = [];
        members.each((m: any) => {
          list.push({ name: m.info.name, socketId: m.id, joinedAt: new Date().toISOString() });
        });
        setMembers(list);
        setConnected(true);
      });

      channel.bind("pusher:subscription_error", () => {
        if (cancelled) return;
        setRoomError("Failed to connect to room");
      });

      channel.bind("pusher:member_added", (member: any) => {
        if (cancelled) return;
        const name: string = member.info?.name ?? "Unknown";
        setMembers((prev) => [...prev, { name, socketId: member.id, joinedAt: new Date().toISOString() }]);
        setMessages((prev) => [...prev, makeSystemMsg(roomCode, `${name} joined the room`)]);
      });

      channel.bind("pusher:member_removed", (member: any) => {
        if (cancelled) return;
        const name: string = member.info?.name ?? "Unknown";
        setMembers((prev) => prev.filter((m) => m.socketId !== member.id));
        if (!kickedNames.current.has(name)) {
          setMessages((prev) => [...prev, makeSystemMsg(roomCode, `${name} left the room`)]);
        } else {
          kickedNames.current.delete(name);
        }
      });

      channel.bind("new-message", (msg: MessageDoc) => {
        if (cancelled) return;
        setMessages((prev) => [...prev, msg]);
      });

      channel.bind("reaction-updated", ({ messageId, reactions }: any) => {
        if (cancelled) return;
        setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
      });

      channel.bind("message-deleted", ({ messageId }: any) => {
        if (cancelled) return;
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m))
        );
      });

      channel.bind("message-seen", ({ messageId, seenBy }: any) => {
        if (cancelled) return;
        setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, seenBy } : m)));
      });

      channel.bind("member-kicked", ({ targetName }: { targetName: string }) => {
        if (cancelled) return;
        if (targetName === userNameRef.current) {
          setKicked(true);
        } else {
          kickedNames.current.add(targetName);
          setMembers((prev) => prev.filter((m) => m.name !== targetName));
          setMessages((prev) => [
            ...prev,
            makeSystemMsg(roomCode, `${targetName} was removed from the room`),
          ]);
        }
      });

      channel.bind("member-renamed", ({ oldName, newName }: { oldName: string; newName: string }) => {
        if (cancelled) return;

        setMembers((prev) =>
          prev.map((m) => (m.name === oldName ? { ...m, name: newName } : m))
        );

        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            senderName: m.senderName === oldName ? newName : m.senderName,
            reactions: m.reactions.map((r) => ({
              ...r,
              names: r.names.map((n) => (n === oldName ? newName : n)),
            })),
            seenBy: m.seenBy.map((n) => (n === oldName ? newName : n)),
          }))
        );

        setRoom((prev) =>
          prev && prev.adminName === oldName ? { ...prev, adminName: newName } : prev
        );

        if (oldName === userNameRef.current) {
          userNameRef.current = newName;
          setCurrentUserName(newName);
        }
      });

      channel.bind("client-typing-start", ({ userName: u }: { userName: string }) => {
        if (cancelled || u === userNameRef.current) return;
        const timer = typingTimers.current.get(u);
        if (timer) clearTimeout(timer);
        setTypingUsers((prev) => (prev.includes(u) ? prev : [...prev, u]));
        const t = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== u));
          typingTimers.current.delete(u);
        }, 3000);
        typingTimers.current.set(u, t);
      });

      channel.bind("client-typing-stop", ({ userName: u }: { userName: string }) => {
        if (cancelled) return;
        const timer = typingTimers.current.get(u);
        if (timer) clearTimeout(timer);
        setTypingUsers((prev) => prev.filter((n) => n !== u));
        typingTimers.current.delete(u);
      });
    }

    init();

    return () => {
      cancelled = true;
      typingTimers.current.forEach(clearTimeout);
      typingTimers.current.clear();
      if (channelRef.current) channelRef.current.unbind_all();
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`presence-room-${roomCode}`);
        pusherRef.current.disconnect();
      }
    };
  }, [roomCode, password]); // intentionally omit initialUserName — connection established once

  const sendMessage = useCallback(
    async (payload: { type: string; content: string; fileName?: string; replyTo?: string }) => {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, senderName: userNameRef.current, ...payload }),
      });
    },
    [roomCode]
  );

  const sendTypingStart = useCallback(() => {
    channelRef.current?.trigger("client-typing-start", { userName: userNameRef.current });
  }, []);

  const sendTypingStop = useCallback(() => {
    channelRef.current?.trigger("client-typing-stop", { userName: userNameRef.current });
  }, []);

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      await fetch(`/api/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, userName: userNameRef.current }),
      });
    },
    []
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: userNameRef.current }),
      });
    },
    []
  );

  const markSeen = useCallback(
    async (messageId: string) => {
      await fetch(`/api/messages/${messageId}/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: userNameRef.current }),
      });
    },
    []
  );

  const kickMember = useCallback(
    async (targetName: string) => {
      await fetch("/api/rooms/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, targetName, adminName: userNameRef.current }),
      });
    },
    [roomCode]
  );

  const renameMember = useCallback(
    async (newName: string) => {
      const res = await fetch("/api/rooms/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, oldName: userNameRef.current, newName }),
      });
      return res;
    },
    [roomCode]
  );

  return {
    room,
    messages,
    members,
    typingUsers,
    connected,
    roomError,
    kicked,
    currentUserName,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    addReaction,
    deleteMessage,
    markSeen,
    kickMember,
    renameMember,
  };
}
