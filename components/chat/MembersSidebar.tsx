"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Member, RoomDoc } from "@/types";

interface Props {
  members: Member[];
  room: RoomDoc;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onKick: (name: string) => void;
}

export function MembersSidebar({ members, room, userName, isOpen, onClose, onKick }: Props) {
  const isAdmin = room.adminName === userName;

  const sidebar = (
    <div className="w-64 h-full flex flex-col bg-slate-950/95 border-l border-slate-800/60">
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
        <h3 className="font-medium text-white text-sm">Members ({members.length})</h3>
        <button
          onClick={onClose}
          className="lg:hidden text-slate-500 hover:text-white transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {members.map((member) => {
          const isSelf = member.name === userName;
          const isMemberAdmin = member.name === room.adminName;
          const canKick = isAdmin && !isSelf && !isMemberAdmin;

          return (
            <div
              key={member.socketId}
              className="flex items-center gap-3 px-4 py-2 hover:bg-slate-800/40 transition rounded-lg mx-1 group"
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-950" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {member.name}
                  {isSelf && <span className="text-slate-500 font-normal"> (you)</span>}
                </p>
                {isMemberAdmin && <p className="text-xs text-violet-400">Admin</p>}
              </div>
              {canKick && (
                <button
                  onClick={() => onKick(member.name)}
                  title={`Remove ${member.name}`}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className={`hidden lg:flex transition-all duration-200 ${isOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        {isOpen && sidebar}
      </div>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 h-full z-50"
            >
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
