"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
  prefillCode?: string;
}

export function JoinRoomModal({ onClose, prefillCode = "" }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(prefillCode.toUpperCase());
  const [name, setName] = useState("");
  const [step, setStep] = useState<"code" | "name">(prefillCode ? "name" : "code");
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState("");

  async function validateCode() {
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms?code=${code.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoomName(data.name);
      setStep("name");
    } catch (err: any) {
      toast.error(err.message || "Room not found");
    } finally {
      setLoading(false);
    }
  }

  function handleJoin() {
    if (!name.trim()) return;
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
          {step === "code"
            ? "Enter the 6-character room code"
            : `Joining "${roomName}" — enter your name`}
        </p>

        {step === "code" ? (
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
        ) : (
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
                onClick={() => setStep("code")}
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
