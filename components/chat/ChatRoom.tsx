"use client";

import { useState } from "react";
import { useRoom } from "@/hooks/useRoom";
import { RoomHeader } from "./RoomHeader";
import { MembersSidebar } from "./MembersSidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { MessageDoc } from "@/types";

interface Props {
  roomCode: string;
  userName: string;
}

export function ChatRoom({ roomCode, userName }: Props) {
  const {
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
  } = useRoom({ roomCode, userName });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageDoc | null>(null);

  if (!connected || !room) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <RoomHeader
        room={room}
        userName={userName}
        members={members}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex flex-col flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            typingUsers={typingUsers}
            userName={userName}
            onReply={setReplyTo}
            onReact={addReaction}
            onDelete={deleteMessage}
            onSeen={markSeen}
          />
          <MessageInput
            onSend={sendMessage}
            onTypingStart={sendTypingStart}
            onTypingStop={sendTypingStop}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>

        <MembersSidebar
          members={members}
          room={room}
          userName={userName}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
