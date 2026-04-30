"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { JoinRoomModal } from "@/components/landing/JoinRoomModal";

interface Props {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: Props) {
  const { code: rawCode } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const nameFromUrl = searchParams.get("name");

  const [userName, setUserName] = useState<string | null>(nameFromUrl);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [verified, setVerified] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const code = rawCode.toUpperCase();

  useEffect(() => {
    const stored = sessionStorage.getItem(`room_otp_${code}`);
    if (stored) setPassword(stored);
    setSessionChecked(true);
  }, [code, nameFromUrl]);

  useEffect(() => {
    async function verify() {
      const res = await fetch(`/api/rooms?code=${code}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }

      setVerified(true);
    }
    verify();
  }, [code]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Room Not Found</h1>
          <p className="text-slate-400 text-sm mb-6">This room doesn&apos;t exist or has expired.</p>
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

  if (!verified || !sessionChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userName) {
    return (
      <div className="min-h-screen bg-slate-950">
        <JoinRoomModal onClose={() => router.push("/")} prefillCode={code} />
      </div>
    );
  }

  return (
    <ChatRoom
      roomCode={code}
      userName={userName}
      password={password}
    />
  );
}
