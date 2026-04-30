"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { RoomDoc, Member } from "@/types";

interface Props {
  room: RoomDoc;
  userName: string;
  members: Member[];
  onToggleSidebar: () => void;
}

export function RoomHeader({ room, userName, members, onToggleSidebar }: Props) {
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
          {room.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-semibold text-white text-sm">{room.name}</h1>
          <p className="text-slate-500 text-xs">{members.length} online</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition group"
        >
          <span className="text-violet-400 font-mono text-xs font-bold tracking-widest">
            {room.code}
          </span>
          <svg
            className="w-3 h-3 text-slate-500 group-hover:text-violet-400 transition"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center transition text-slate-400 hover:text-white"
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.73 12.73.707.707M1 12h2m18 0h2M4.22 19.78l.707-.707m12.73-12.73.707-.707M12 6a6 6 0 110 12A6 6 0 0112 6z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
            </svg>
          )}
        </button>

        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center transition text-slate-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
