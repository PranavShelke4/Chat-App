"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useRoom } from "@/hooks/useRoom";
import { RoomHeader } from "./RoomHeader";
import { MembersSidebar } from "./MembersSidebar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { MessageDoc, RoomDoc } from "@/types";
import { RoomRole, upsertRecentRoom } from "@/lib/localRooms";

interface Props {
  roomCode: string;
  userName: string;
  password?: string;
  onJoined?: (room: RoomDoc) => void;
}

export function ChatRoom({ roomCode, userName, password, onJoined }: Props) {
  const router = useRouter();
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageDoc | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

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

  async function handleOtpReentry() {
    if (otpInput.length < 6) return;
    setOtpLoading(true);
    try {
      const res = await fetch("/api/rooms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: roomCode, password: otpInput }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Invalid OTP");
        return;
      }
      sessionStorage.setItem(`room_otp_${roomCode}`, otpInput);
      window.location.reload();
    } catch {
      toast.error("Failed to verify OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  if (kicked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Removed from Room</h1>
          <p className="text-slate-400 text-sm mb-6">The admin removed you from this room.</p>
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

  if (roomError) {
    const isOtpError = roomError === "Invalid OTP";
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Access Denied</h1>
            <p className="text-slate-400 text-sm">{roomError}</p>
          </div>

          {isOtpError ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
              <p className="text-sm text-slate-300 mb-3 text-center">
                The OTP may have changed. Enter the new one from the admin.
              </p>
              <input
                autoFocus
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleOtpReentry()}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.4em] placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition mb-3"
              />
              <button
                onClick={handleOtpReentry}
                disabled={otpInput.length < 6 || otpLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium disabled:opacity-50 transition"
              >
                {otpLoading ? "Verifying…" : "Enter Room"}
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full mt-2 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition text-sm"
              >
                Go Home
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium transition"
            >
              Go Home
            </button>
          )}
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
    <div className="h-dvh bg-slate-950 flex flex-col overflow-hidden">
      <RoomHeader
        room={room}
        userName={userName}
        members={members}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
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
          onKick={kickMember}
        />
      </div>
    </div>
  );
}
