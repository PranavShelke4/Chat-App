"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { RoomHeader } from "./RoomHeader";
import { MembersSidebar } from "./MembersSidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { MessageDoc } from "@/types";

interface Props {
  roomCode: string;
  userName: string;
  password?: string;
}

export function ChatRoom({ roomCode, userName, password }: Props) {
  const router = useRouter();
  const {
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
  } = useRoom({ roomCode, userName, password });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageDoc | null>(null);

  if (roomError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V7m0 0a5 5 0 110 10A5 5 0 0112 7z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 text-sm mb-6">{roomError}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

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
