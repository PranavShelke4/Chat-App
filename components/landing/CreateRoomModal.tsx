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
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ code: string; roomName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Chat Room", adminName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreated({ code: data.code, roomName: data.name });
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

  function enterRoom() {
    if (!created) return;
    router.push(`/room/${created.code}?name=${encodeURIComponent(name)}&admin=true`);
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
        <p className="text-slate-400 text-sm mb-6">Enter your name to create a new chat room</p>

        {!created ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Pranav"
                maxLength={24}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || loading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-slate-800/60 border border-violet-500/30 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm mb-2">Your Room Code</p>
              <p className="text-4xl font-bold tracking-[0.3em] text-white">{created.code}</p>
            </div>
            <button
              onClick={copyCode}
              className="w-full py-3 rounded-xl border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition flex items-center justify-center gap-2"
            >
              {copied ? "✓ Copied!" : "Copy Code"}
            </button>
            <p className="text-slate-500 text-xs text-center">
              Share this code with people you want to invite
            </p>
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
