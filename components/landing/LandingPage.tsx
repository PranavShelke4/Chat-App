"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinRoomModal } from "./JoinRoomModal";

export function LandingPage() {
  const [modal, setModal] = useState<"create" | "join" | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Logo / Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative z-10"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">ChatRoom</h1>
        <p className="text-slate-400 mt-2 text-lg">Instant anonymous chat. No account needed.</p>
      </motion.div>

      {/* Action Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg relative z-10"
      >
        {/* Create Room */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModal("create")}
          className="group relative bg-slate-900/80 backdrop-blur border border-slate-700/50 hover:border-violet-500/50 rounded-2xl p-6 text-left transition-all duration-200 shadow-lg hover:shadow-violet-900/20"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mb-4 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Create Room</h2>
          <p className="text-slate-400 text-sm">Start a new chat room and invite friends with a code</p>
          <div className="absolute bottom-4 right-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </div>
        </motion.button>

        {/* Join Room */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModal("join")}
          className="group relative bg-slate-900/80 backdrop-blur border border-slate-700/50 hover:border-violet-500/50 rounded-2xl p-6 text-left transition-all duration-200 shadow-lg hover:shadow-violet-900/20"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center mb-4 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Join Room</h2>
          <p className="text-slate-400 text-sm">Enter a room code to join an existing conversation</p>
          <div className="absolute bottom-4 right-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </div>
        </motion.button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-slate-600 text-sm relative z-10"
      >
        Rooms expire after 7 days of inactivity
      </motion.p>

      <AnimatePresence>
        {modal === "create" && <CreateRoomModal onClose={() => setModal(null)} />}
        {modal === "join" && <JoinRoomModal onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
