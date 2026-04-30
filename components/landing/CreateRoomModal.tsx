"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
}

export function CreateRoomModal({ onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [enablePassword, setEnablePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ code: string; roomName: string; password: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !roomName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName.trim(), adminName: name.trim(), enablePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreated({ code: data.code, roomName: data.name, password: data.password ?? null });
      if (data.password) {
        sessionStorage.setItem(`room_otp_${data.code}`, data.password);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!created) return;
    navigator.clipboard.writeText(created.code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function copyOtp() {
    if (!created?.password) return;
    navigator.clipboard.writeText(created.password);
    setCopiedOtp(true);
    toast.success("OTP copied!");
    setTimeout(() => setCopiedOtp(false), 2000);
  }

  function enterRoom() {
    if (!created) return;
    router.push(`/room/${created.code}?name=${encodeURIComponent(name)}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !created && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-violet-950/20"
      >
        <h2 className="text-xl font-semibold text-white mb-1">Create a Room</h2>
        <p className="text-slate-400 text-sm mb-6">Give your room a name and enter your display name</p>

        {!created ? (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-300 mb-2">Room Name</label>
              <input
                autoFocus
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Weekend Trip Planning"
                maxLength={40}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Pranav"
                maxLength={24}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => setEnablePassword((p) => !p)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition mb-4 ${
                enablePassword
                  ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                  : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                  enablePassword ? "border-violet-500 bg-violet-500" : "border-slate-600"
                }`}
              >
                {enablePassword && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Protect with OTP password</p>
                <p className="text-xs text-slate-500 mt-0.5">Members must enter a 6-digit code to join</p>
              </div>
              <svg
                className={`w-4 h-4 ml-auto flex-shrink-0 transition ${enablePassword ? "text-violet-400" : "text-slate-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !roomName.trim() || loading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="bg-slate-800/60 border border-violet-500/30 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">Room Code</p>
              <p className="text-4xl font-bold tracking-[0.3em] text-white">{created.code}</p>
            </div>
            <button
              onClick={copyCode}
              className="w-full py-3 rounded-xl border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition flex items-center justify-center gap-2 text-sm"
            >
              {copied ? "✓ Copied!" : "Copy Room Code"}
            </button>

            {created.password && (
              <>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-amber-400 text-xs font-medium">OTP Password</p>
                  </div>
                  <p className="text-3xl font-bold tracking-[0.4em] text-amber-300">{created.password}</p>
                </div>
                <button
                  onClick={copyOtp}
                  className="w-full py-3 rounded-xl border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition flex items-center justify-center gap-2 text-sm"
                >
                  {copiedOtp ? "✓ Copied!" : "Copy OTP"}
                </button>
                <p className="text-slate-500 text-xs text-center">
                  Share both the room code and OTP with trusted members
                </p>
              </>
            )}

            {!created.password && (
              <p className="text-slate-500 text-xs text-center">
                Share this code with people you want to invite
              </p>
            )}

            <button
              onClick={enterRoom}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium transition"
            >
              Enter Room →
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
