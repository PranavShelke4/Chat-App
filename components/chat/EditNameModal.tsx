"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  currentName: string;
  onSave: (newName: string) => Promise<void>;
  onClose: () => void;
}

export function EditNameModal({ currentName, onSave, onClose }: Props) {
  const [value, setValue] = useState(currentName);
  const [loading, setLoading] = useState(false);

  const canSave = value.trim().length > 0 && value.trim() !== currentName;

  async function handleSave() {
    if (!canSave) return;
    setLoading(true);
    try {
      await onSave(value.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <h2 className="text-base font-semibold text-white mb-4">Change your name</h2>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          maxLength={32}
          placeholder="Enter new name"
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium text-sm disabled:opacity-50 transition"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
