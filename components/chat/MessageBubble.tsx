"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { MessageDoc } from "@/types";
import { MediaPreview } from "./MediaPreview";
import { SystemMessage } from "./SystemMessage";

const EMOJI_SET = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface Props {
  message: MessageDoc;
  isOwn: boolean;
  userName: string;
  onReply: (msg: MessageDoc) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, userName, onReply, onReact, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const hideTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  if (message.type === "system") return <SystemMessage message={message} />;

  const isDeleted = !!message.deletedAt;

  function handleMouseEnter() {
    clearTimeout(hideTimer.current);
    setShowActions(true);
  }

  function handleMouseLeave() {
    hideTimer.current = setTimeout(() => {
      setShowActions(false);
      setShowEmojiPicker(false);
    }, 400);
  }

  const totalReactions = message.reactions.filter((r) => r.names.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 group px-4 ${isOwn ? "flex-row-reverse" : "flex-row"} mb-1`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
          {message.senderName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <span className="text-xs text-slate-500 mb-1 ml-1">{message.senderName}</span>
        )}

        {message.replyTo && (
          <div
            className={`text-xs text-slate-400 border-l-2 border-violet-500/60 pl-2 mb-1 truncate max-w-full ${
              isOwn ? "text-right border-r-2 border-l-0 pr-2" : ""
            }`}
          >
            ↩ {(message.replyTo as any).senderName}:{" "}
            {(message.replyTo as any).deletedAt
              ? "Deleted"
              : (message.replyTo as any).content?.slice(0, 40)}
          </div>
        )}

        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
              isDeleted
                ? "bg-slate-800/40 text-slate-500 italic border border-slate-700/30"
                : isOwn
                ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-sm shadow-md shadow-violet-900/30"
                : "bg-slate-800/80 text-slate-100 rounded-bl-sm border border-slate-700/30"
            }`}
          >
            {isDeleted ? (
              "This message was deleted"
            ) : message.type === "text" ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <MediaPreview message={message} />
            )}
          </div>

          <AnimatePresence>
            {showActions && !isDeleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isOwn ? "-left-28" : "-right-28"
                } flex items-center gap-1 bg-slate-800 border border-slate-700/50 rounded-xl p-1 shadow-lg z-10`}
              >
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white text-sm"
                >
                  😊
                </button>
                <button
                  onClick={() => onReply(message)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
                {isOwn && (
                  <button
                    onClick={() => onDelete(message._id)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-red-500/20 rounded-lg transition text-slate-400 hover:text-red-400"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className={`absolute bottom-full mb-2 ${
                  isOwn ? "right-0" : "left-0"
                } flex gap-1 bg-slate-800 border border-slate-700/50 rounded-xl p-2 shadow-lg z-20`}
              >
                {EMOJI_SET.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message._id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg transition text-lg hover:scale-125 transform"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {totalReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {totalReactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(message._id, r.emoji)}
                title={r.names.join(", ")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition ${
                  r.names.includes(userName)
                    ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                    : "bg-slate-800 border-slate-700/50 text-slate-300 hover:border-violet-500/40"
                }`}
              >
                {r.emoji} <span>{r.names.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-slate-600">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
          {isOwn && message.seenBy.length > 1 && (
            <span className="text-xs text-violet-500/70">✓✓ {message.seenBy.length - 1}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
