"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { RoomDoc } from "@/types";
import { removeRecentRoom } from "@/lib/localRooms";

interface Props {
  room: RoomDoc;
  onClose: () => void;
}

export function OtpSecurityModal({ room, onClose }: Props) {
  const router = useRouter();
  const [data, setData] = useState<{ password: string | null; locked: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  useEffect(() => {
    fetch(`/api/rooms/admin?code=${room.code}&adminName=${encodeURIComponent(room.adminName)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [room.code, room.adminName]);

  async function rotateOtp() {
    setRotating(true);
    try {
      const res = await fetch("/api/rooms/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: room.code, adminName: room.adminName, rotateOtp: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData((prev) => (prev ? { ...prev, password: d.password } : null));
      if (d.password) sessionStorage.setItem(`room_otp_${room.code}`, d.password);
      toast.success("New OTP generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to rotate OTP");
    } finally {
      setRotating(false);
    }
  }

  async function toggleLock() {
    if (!data) return;
    setToggling(true);
    try {
      const res = await fetch("/api/rooms/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: room.code, adminName: room.adminName, locked: !data.locked }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData((prev) => (prev ? { ...prev, locked: d.locked } : null));
      toast.success(d.locked ? "Room locked — no new joins" : "Room unlocked");
    } catch (err: any) {
      toast.error(err.message || "Failed to update room");
    } finally {
      setToggling(false);
    }
  }

  async function deleteRoom() {
    if (!window.confirm(`Delete ${room.name}? This removes all messages and closes the room.`)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/rooms/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: room.code, adminName: room.adminName }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);

      removeRecentRoom(room.code);
      toast.success("Room deleted");
      onClose();
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete room");
    } finally {
      setDeleting(false);
    }
  }

  function copyOtp() {
    if (!data?.password) return;
    navigator.clipboard.writeText(data.password);
    setCopiedOtp(true);
    toast.success("OTP copied!");
    setTimeout(() => setCopiedOtp(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-violet-950/20"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-white">Security Panel</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {data?.password ? (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Current OTP
                </p>
                <div className="bg-slate-800 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-2xl font-bold tracking-[0.35em] text-amber-300 font-mono">
                    {data.password}
                  </span>
                  <button
                    onClick={copyOtp}
                    className="text-slate-400 hover:text-amber-400 transition ml-3 flex-shrink-0"
                    title="Copy OTP"
                  >
                    {copiedOtp ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={rotateOtp}
                  disabled={rotating}
                  className="mt-2 w-full py-2.5 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2"
                >
                  {rotating ? (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {rotating ? "Generating…" : "Generate New OTP"}
                </button>
                <p className="text-xs text-slate-600 mt-1.5 text-center">
                  Rotating OTP invalidates access for anyone who hasn't re-entered it
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/40 rounded-xl px-4 py-3 text-sm text-slate-500 text-center">
                This room has no OTP password set.
              </div>
            )}

            <div className="border-t border-slate-800/60 pt-4">
              <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Room Access
              </p>
              <button
                onClick={toggleLock}
                disabled={toggling}
                className={`w-full py-2.5 rounded-xl border transition text-sm flex items-center justify-center gap-2 ${
                  data?.locked
                    ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {toggling ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : data?.locked ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Room Locked — Click to Unlock
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Lock Room (block new joins)
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-slate-800/60 pt-4">
              <button
                onClick={deleteRoom}
                disabled={deleting}
                className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                Delete Room
              </button>
              <p className="text-xs text-slate-600 mt-1.5 text-center">
                This cannot be undone.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
