"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { RoomDoc, Member } from "@/types";
import { OtpSecurityModal } from "./OtpSecurityModal";

interface Props {
  room: RoomDoc;
  userName: string;
  members: Member[];
  onToggleSidebar: () => void;
  onEditName: () => void;
}

export function RoomHeader({ room, userName, members, onToggleSidebar, onEditName }: Props) {
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const isAdmin = room.adminName === userName;

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-3 sm:px-4 py-3 border-b border-slate-800/60 bg-slate-950/85 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0">
              {room.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-semibold text-white text-sm sm:text-base truncate max-w-[12rem] sm:max-w-none">
                  {room.name}
                </h1>
                {room.locked && (
                  <span className="flex items-center gap-1 text-[11px] sm:text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Locked
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">{members.length} online</p>
            </div>
          </div>

          <button
            onClick={onToggleSidebar}
            className="lg:hidden w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center transition text-slate-300 hover:text-white flex-shrink-0"
            aria-label="Open members"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition group min-w-0"
          >
            <span className="text-violet-400 font-mono text-xs font-bold tracking-widest truncate max-w-[7rem] sm:max-w-none">
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

          {isAdmin && (
            <button
              onClick={() => setShowSecurity(true)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-violet-600/20 border border-slate-700/50 hover:border-violet-500/40 flex items-center justify-center transition text-slate-400 hover:text-violet-400"
              title="Security Panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          )}

          <button
            onClick={onEditName}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center transition text-slate-400 hover:text-white"
            title="Change your name"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center transition text-slate-400 hover:text-white"
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
            className="hidden lg:flex w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 items-center justify-center transition text-slate-400 hover:text-white"
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

      <AnimatePresence>{showSecurity && <OtpSecurityModal room={room} onClose={() => setShowSecurity(false)} />}</AnimatePresence>
    </>
  );
}
