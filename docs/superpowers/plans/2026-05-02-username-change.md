# Username Change with Admin Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow any room member to change their display name mid-session, with admin role automatically persisting if the renaming user is the room admin.

**Architecture:** A new `PATCH /api/rooms/rename` endpoint bulk-updates `senderName`, `reactions[].names`, and `seenBy` in all room messages, and updates `room.adminName` if the renamer is admin. A Pusher `member-renamed` event keeps all connected clients' in-memory state in sync. `useRoom` tracks username via a ref so the Pusher connection is never re-established on rename.

**Tech Stack:** Next.js 14 App Router, TypeScript, Mongoose/MongoDB, Pusher server SDK (`pusher`), Pusher client SDK (`pusher-js`), Tailwind CSS, Framer Motion, react-hot-toast.

---

## File Map

| Status | File | Change |
|--------|------|--------|
| Modify | `lib/socketEvents.ts` | Add `MEMBER_RENAMED` constant |
| Modify | `lib/localRooms.ts` | Add `updateRoomUserName` helper |
| Create | `app/api/rooms/rename/route.ts` | PATCH endpoint |
| Modify | `hooks/useRoom.ts` | Ref-based userName, `member-renamed` handler, expose `renameMember` + `currentUserName` |
| Create | `components/chat/EditNameModal.tsx` | Rename modal component |
| Modify | `components/chat/RoomHeader.tsx` | Settings button + `onEditName` prop |
| Modify | `components/chat/ChatRoom.tsx` | Wire modal, use `currentUserName` everywhere |

---

## Task 1: Add MEMBER_RENAMED event constant

**Files:**
- Modify: `lib/socketEvents.ts`

- [ ] **Step 1: Add the constant**

Open `lib/socketEvents.ts` and add `MEMBER_RENAMED` to the `SOCKET_EVENTS` object:

```typescript
export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  SEND_MESSAGE: "send-message",
  TYPING_START: "typing-start",
  TYPING_STOP: "typing-stop",
  ADD_REACTION: "add-reaction",
  DELETE_MESSAGE: "delete-message",
  SEEN_MESSAGE: "seen-message",

  // Client → Server (admin actions)
  KICK_MEMBER: "kick-member",

  // Server → Client
  ROOM_ERROR: "room-error",
  KICKED: "kicked",
  ROOM_JOINED: "room-joined",
  NEW_MESSAGE: "new-message",
  MEMBER_JOINED: "member-joined",
  MEMBER_LEFT: "member-left",
  MEMBER_RENAMED: "member-renamed",
  TYPING_UPDATE: "typing-update",
  REACTION_UPDATED: "reaction-updated",
  MESSAGE_DELETED: "message-deleted",
  MESSAGE_SEEN: "message-seen",
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/socketEvents.ts
git commit -m "feat: add MEMBER_RENAMED socket event constant"
```

---

## Task 2: Add updateRoomUserName to localRooms

**Files:**
- Modify: `lib/localRooms.ts`

- [ ] **Step 1: Add the helper function**

Append `updateRoomUserName` after the existing `removeRecentRoom` function in `lib/localRooms.ts`:

```typescript
export function updateRoomUserName(code: string, newName: string) {
  if (!canUseStorage()) return;

  const rooms = readRooms().map((room) =>
    room.code === code.toUpperCase() ? { ...room, userName: newName } : room
  );
  writeRooms(rooms);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/localRooms.ts
git commit -m "feat: add updateRoomUserName helper to localRooms"
```

---

## Task 3: Create PATCH /api/rooms/rename endpoint

**Files:**
- Create: `app/api/rooms/rename/route.ts`

- [ ] **Step 1: Create the file**

Create `app/api/rooms/rename/route.ts` with this content:

```typescript
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
```

- [ ] **Step 2: Verify the server starts without errors**

```bash
npm run dev
```

Expected: Dev server starts on port 3000 with no TypeScript or module errors.

- [ ] **Step 3: Smoke test the endpoint manually**

With dev server running, open a room and run in the browser console:

```javascript
await fetch("/api/rooms/rename", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ roomCode: "YOUR_CODE", oldName: "YourName", newName: "NewName" })
}).then(r => r.json())
```

Expected: `{ ok: true }`

- [ ] **Step 4: Commit**

```bash
git add app/api/rooms/rename/route.ts
git commit -m "feat: add PATCH /api/rooms/rename endpoint"
```

---

## Task 4: Update useRoom — ref-based userName, member-renamed handler, renameMember

**Files:**
- Modify: `hooks/useRoom.ts`

This task is the most involved. We need to:
1. Store username in a ref so it stays current in Pusher callbacks without triggering reconnect
2. Track username as state so components can re-render on change
3. Remove `userName` from the `useEffect` dependency array (intentional — connection established once per roomCode+password)
4. Add `member-renamed` Pusher event handler that updates messages, members, room.adminName
5. Expose `renameMember` function and `currentUserName`

- [ ] **Step 1: Replace the full contents of hooks/useRoom.ts**

```typescript
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

        // Update members list
        setMembers((prev) =>
          prev.map((m) => (m.name === oldName ? { ...m, name: newName } : m))
        );

        // Update in-memory messages (DB already updated by API)
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

        // Update room.adminName if the renamed person was the admin
        setRoom((prev) =>
          prev && prev.adminName === oldName ? { ...prev, adminName: newName } : prev
        );

        // Update our own ref and state if we are the person being renamed
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useRoom.ts
git commit -m "feat: add ref-based userName tracking and renameMember to useRoom"
```

---

## Task 5: Create EditNameModal component

**Files:**
- Create: `components/chat/EditNameModal.tsx`

- [ ] **Step 1: Create the file**

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  currentName: string;
  onSave: (newName: string) => Promise<void>;
  onClose: () => void;
}

export function EditNameModal({ currentName, onSave, onClose }: Props) {
  const [value, setValue] = useState(currentName);
  const [loading, setLoading] = useState(false);

  const canSave = value.trim().length > 0 && value.trim() !== currentName;

  async function handleSave() {
    if (!canSave) return;
    setLoading(true);
    try {
      await onSave(value.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <h2 className="text-base font-semibold text-white mb-4">Change your name</h2>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          maxLength={32}
          placeholder="Enter new name"
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium text-sm disabled:opacity-50 transition"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/chat/EditNameModal.tsx
git commit -m "feat: add EditNameModal component"
```

---

## Task 6: Update RoomHeader — add settings button

**Files:**
- Modify: `components/chat/RoomHeader.tsx`

Two changes: add `onEditName: () => void` to the Props interface, and add a settings icon button visible to all users.

- [ ] **Step 1: Add onEditName to Props interface**

Change the Props interface from:
```typescript
interface Props {
  room: RoomDoc;
  userName: string;
  members: Member[];
  onToggleSidebar: () => void;
}
```

To:
```typescript
interface Props {
  room: RoomDoc;
  userName: string;
  members: Member[];
  onToggleSidebar: () => void;
  onEditName: () => void;
}
```

- [ ] **Step 2: Add onEditName to the function signature**

Change:
```typescript
export function RoomHeader({ room, userName, members, onToggleSidebar }: Props) {
```

To:
```typescript
export function RoomHeader({ room, userName, members, onToggleSidebar, onEditName }: Props) {
```

- [ ] **Step 3: Add the settings button after the admin security button**

Locate this block in `RoomHeader.tsx` (lines 95–121):
```typescript
          {isAdmin && (
            <button
              onClick={() => setShowSecurity(true)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-violet-600/20 border border-slate-700/50 hover:border-violet-500/40 flex items-center justify-center transition text-slate-400 hover:text-violet-400"
              title="Security Panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
```

Add the settings button between the security button block and the theme toggle:
```typescript
          {isAdmin && (
            <button
              onClick={() => setShowSecurity(true)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-violet-600/20 border border-slate-700/50 hover:border-violet-500/40 flex items-center justify-center transition text-slate-400 hover:text-violet-400"
              title="Security Panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          )}

          <button
            onClick={onEditName}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center transition text-slate-400 hover:text-white"
            title="Change your name"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: TypeScript will error on `ChatRoom.tsx` (missing `onEditName` prop) — that's fine, it gets fixed in the next task.

- [ ] **Step 5: Commit**

```bash
git add components/chat/RoomHeader.tsx
git commit -m "feat: add settings (edit name) button to RoomHeader"
```

---

## Task 7: Update ChatRoom — wire modal, use currentUserName

**Files:**
- Modify: `components/chat/ChatRoom.tsx`

This task wires everything together. Key changes:
1. Import `EditNameModal` and `updateRoomUserName`
2. Destructure `currentUserName` and `renameMember` from `useRoom`
3. Add `showEditName` state
4. Add `handleRename` function (calls `renameMember`, updates URL + localStorage)
5. Replace all `userName` usages with `currentUserName` where it affects displayed identity
6. Render `<EditNameModal>` inside `<AnimatePresence>`
7. Pass `onEditName` to `<RoomHeader>`

- [ ] **Step 1: Update imports at the top of ChatRoom.tsx**

Change:
```typescript
import { RoomRole, upsertRecentRoom } from "@/lib/localRooms";
```

To:
```typescript
import { RoomRole, upsertRecentRoom, updateRoomUserName } from "@/lib/localRooms";
```

Add `EditNameModal` to the component imports:
```typescript
import { EditNameModal } from "./EditNameModal";
```

Also add `AnimatePresence` to the framer-motion import (if not already present — check the current imports; `ChatRoom.tsx` doesn't currently import framer-motion, so add it):
```typescript
import { AnimatePresence } from "framer-motion";
```

- [ ] **Step 2: Destructure currentUserName and renameMember from useRoom**

Change the `useRoom` destructuring from:
```typescript
  const {
    room,
    messages,
    members,
    typingUsers,
    connected,
    roomError,
    kicked,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    addReaction,
    deleteMessage,
    markSeen,
    kickMember,
  } = useRoom({ roomCode, userName, password });
```

To:
```typescript
  const {
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
  } = useRoom({ roomCode, userName, password });
```

- [ ] **Step 3: Add showEditName state**

After the existing state declarations (after `const [otpLoading, setOtpLoading] = useState(false);`), add:

```typescript
  const [showEditName, setShowEditName] = useState(false);
```

- [ ] **Step 4: Add handleRename function**

After the `handleOtpReentry` function, add:

```typescript
  async function handleRename(newName: string) {
    const res = await renameMember(newName);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Failed to rename");
      throw new Error(d.error);
    }
    router.replace(`/room/${roomCode}?name=${encodeURIComponent(newName)}`);
    updateRoomUserName(roomCode, newName);
  }
```

- [ ] **Step 5: Update the upsertRecentRoom useEffect to use currentUserName**

Change the `useEffect` that calls `upsertRecentRoom` from:
```typescript
  useEffect(() => {
    if (!connected || !room) return;

    const role: RoomRole = room.adminName === userName ? "admin" : "member";
    upsertRecentRoom({
      code: room.code,
      name: room.name,
      userName,
      role,
      passwordProtected: room.passwordProtected,
    });
    sessionStorage.removeItem(`room_otp_${roomCode}`);
    onJoined?.(room);
  }, [connected, room, roomCode, userName, onJoined]);
```

To:
```typescript
  useEffect(() => {
    if (!connected || !room) return;

    const role: RoomRole = room.adminName === currentUserName ? "admin" : "member";
    upsertRecentRoom({
      code: room.code,
      name: room.name,
      userName: currentUserName,
      role,
      passwordProtected: room.passwordProtected,
    });
    sessionStorage.removeItem(`room_otp_${roomCode}`);
    onJoined?.(room);
  }, [connected, room, roomCode, currentUserName, onJoined]);
```

- [ ] **Step 6: Update the connected room JSX — pass currentUserName and onEditName**

In the `return` statement for the connected room view, change `<RoomHeader>` from:
```typescript
      <RoomHeader
        room={room}
        userName={userName}
        members={members}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />
```

To:
```typescript
      <RoomHeader
        room={room}
        userName={currentUserName}
        members={members}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onEditName={() => setShowEditName(true)}
      />
```

Change `<MessageList>` from:
```typescript
          <MessageList
            messages={messages}
            typingUsers={typingUsers}
            userName={userName}
            onReply={setReplyTo}
            onReact={addReaction}
            onDelete={deleteMessage}
            onSeen={markSeen}
          />
```

To:
```typescript
          <MessageList
            messages={messages}
            typingUsers={typingUsers}
            userName={currentUserName}
            onReply={setReplyTo}
            onReact={addReaction}
            onDelete={deleteMessage}
            onSeen={markSeen}
          />
```

Change `<MembersSidebar>` from:
```typescript
        <MembersSidebar
          members={members}
          room={room}
          userName={userName}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onKick={kickMember}
        />
```

To:
```typescript
        <MembersSidebar
          members={members}
          room={room}
          userName={currentUserName}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onKick={kickMember}
        />
```

- [ ] **Step 7: Add AnimatePresence + EditNameModal to the return**

At the end of the connected room `return`, just before the closing `</div>`, add:

```typescript
      <AnimatePresence>
        {showEditName && (
          <EditNameModal
            currentName={currentUserName}
            onSave={handleRename}
            onClose={() => setShowEditName(false)}
          />
        )}
      </AnimatePresence>
```

The full return block should end like:

```typescript
  return (
    <div className="h-dvh bg-slate-950 flex flex-col overflow-hidden">
      <RoomHeader
        room={room}
        userName={currentUserName}
        members={members}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onEditName={() => setShowEditName(true)}
      />

      {/* ... notification banner ... */}

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <div className="flex flex-col flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            typingUsers={typingUsers}
            userName={currentUserName}
            onReply={setReplyTo}
            onReact={addReaction}
            onDelete={deleteMessage}
            onSeen={markSeen}
          />
          <MessageInput ... />
        </div>

        <MembersSidebar
          members={members}
          room={room}
          userName={currentUserName}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onKick={kickMember}
        />
      </div>

      <AnimatePresence>
        {showEditName && (
          <EditNameModal
            currentName={currentUserName}
            onSave={handleRename}
            onClose={() => setShowEditName(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
```

- [ ] **Step 8: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 9: End-to-end manual verification**

Start the dev server (`npm run dev`) and test:

1. **Basic rename (member):**
   - Open a room as a member
   - Click the profile/settings button in the header
   - Type a new name → Save
   - Confirm: member name updates in the sidebar, old messages show new name, URL updates to `?name=NewName`

2. **Admin rename preserves admin:**
   - Open a room as the admin
   - Rename yourself
   - Confirm: the Security Panel button (shield icon) is still visible after rename
   - Confirm: you can still kick members / access admin features

3. **Other clients see the update:**
   - Open the same room in a second browser tab
   - Rename in the first tab
   - Confirm: second tab's member sidebar updates the name without page reload

4. **Error handling:**
   - With network DevTools offline, try to rename → confirm error toast appears, modal stays open

- [ ] **Step 10: Commit**

```bash
git add components/chat/ChatRoom.tsx
git commit -m "feat: wire username change modal into ChatRoom with admin persistence"
```

---

## Verification Checklist

- [ ] Settings (profile) button appears in header for all users
- [ ] Modal opens pre-filled with current name
- [ ] Save is disabled when name is empty or unchanged
- [ ] Successful rename: URL param updates, localStorage updates, member sidebar updates
- [ ] Admin rename: Security Panel button stays visible after rename
- [ ] Admin rename: `room.adminName` updated in DB (can verify via MongoDB or re-joining room)
- [ ] Reactions and seenBy updated in DB for renamed user
- [ ] Second tab receives `member-renamed` event and updates sidebar + messages live
- [ ] Error toast shown on API failure, modal stays open
