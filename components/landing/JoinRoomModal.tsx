"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RecentRoom, upsertRecentRoom } from "@/lib/localRooms";

interface Props {
  onClose: () => void;
  prefillCode?: string;
  prefillName?: string;
  onRecentRoomSaved?: (room: RecentRoom) => void;
}

export function JoinRoomModal({ onClose, prefillCode = "", prefillName = "", onRecentRoomSaved }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [otp, setOtp] = useState("");
  const [name, setName] = useState(prefillName);
  const [step, setStep] = useState<"code" | "otp" | "name">(prefillCode ? (prefillName ? "name" : "code") : "code");
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [passwordProtected, setPasswordProtected] = useState(false);

  async function validateCode() {
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms?code=${code.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoomName(data.name);
      setPasswordProtected(data.passwordProtected ?? false);
      setStep(data.passwordProtected ? "otp" : "name");
    } catch (err: any) {
      toast.error(err.message || "Room not found");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/rooms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), password: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      sessionStorage.setItem(`room_otp_${code.trim().toUpperCase()}`, otp.trim());
      setStep("name");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  function handleJoin() {
    if (!name.trim()) return;
    const recentRoom = upsertRecentRoom({
      code: code.trim().toUpperCase(),
      name: roomName,
      userName: name.trim(),
      role: "member",
      passwordProtected,
    });
    if (recentRoom) onRecentRoomSaved?.(recentRoom);
    router.push(`/room/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-violet-950/20"
      >
        <h2 className="text-xl font-semibold text-white mb-1">Join a Room</h2>
        <p className="text-slate-400 text-sm mb-6">
          {step === "code" && "Enter the 6-character room code"}
          {step === "otp" && `"${roomName}" is password protected — enter the OTP`}
          {step === "name" && `Joining "${roomName}" — enter your name`}
        </p>

        {step === "code" && (
          <>
            <input
              autoFocus
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6)
                )
              }
              onKeyDown={(e) => e.key === "Enter" && validateCode()}
              placeholder="e.g. XK92PL"
              maxLength={6}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.3em] placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={validateCode}
                disabled={code.length < 6 || loading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium disabled:opacity-50 transition"
              >
                {loading ? "Checking..." : "Continue →"}
              </button>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-amber-300 text-xs">Ask the room admin for the 6-digit OTP</p>
            </div>
            <input
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              placeholder="000000"
              maxLength={6}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.4em] placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setStep("code"); setOtp(""); }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
              >
                ← Back
              </button>
              <button
                onClick={verifyOtp}
                disabled={otp.length < 6 || loading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium disabled:opacity-50 transition"
              >
                {loading ? "Verifying..." : "Verify OTP →"}
              </button>
            </div>
          </>
        )}

        {step === "name" && (
          <>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Your name"
              maxLength={24}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(passwordProtected ? "otp" : "code")}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
              >
                ← Back
              </button>
              <button
                onClick={handleJoin}
                disabled={!name.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium disabled:opacity-50 transition"
              >
                Join Room
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
