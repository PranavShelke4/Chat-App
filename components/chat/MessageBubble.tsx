"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { MessageDoc } from "@/types";
import { MediaPreview } from "./MediaPreview";
import { SystemMessage } from "./SystemMessage";

const EMOJI_SET = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const SWIPE_THRESHOLD = 60;
const LONG_PRESS_DELAY = 500;

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
  const [swipeX, setSwipeX] = useState(0);
  const [swipeReady, setSwipeReady] = useState(false);

  const hideTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const longPressTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isTouchDevice = useRef(false);
  const swiping = useRef(false);

  if (message.type === "system") return <SystemMessage message={message} />;

  const isDeleted = !!message.deletedAt;
  const seen = new Set<string>();
  const totalReactions = message.reactions.filter((r) => {
    if (r.names.length === 0 || seen.has(r.emoji)) return false;
    seen.add(r.emoji);
    return true;
  });

  // ── Desktop hover ──────────────────────────────────────────────────────────
  function handleMouseEnter() {
    if (isTouchDevice.current) return;
    clearTimeout(hideTimer.current);
    setShowActions(true);
  }

  function handleMouseLeave() {
    if (isTouchDevice.current) return;
    hideTimer.current = setTimeout(() => {
      setShowActions(false);
      setShowEmojiPicker(false);
    }, 400);
  }

  // ── Touch: long-press + directional swipe ─────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    isTouchDevice.current = true;
    swiping.current = false;
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };

    longPressTimer.current = setTimeout(() => {
      if (!swiping.current) {
        setShowActions(true);
        navigator.vibrate?.(50);
      }
    }, LONG_PRESS_DELAY);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearTimeout(longPressTimer.current);
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      // Own messages: pull left. Others: pull right.
      const effective = isOwn ? -dx : dx;
      if (effective > 0) {
        swiping.current = true;
        const clamped = Math.min(effective, SWIPE_THRESHOLD + 24);
        setSwipeX(isOwn ? -clamped : clamped);
        setSwipeReady(effective >= SWIPE_THRESHOLD);
      }
    }
  }

  function handleTouchEnd() {
    clearTimeout(longPressTimer.current);
    if (swipeReady) {
      onReply(message);
      navigator.vibrate?.(30);
    }
    setSwipeX(0);
    setSwipeReady(false);
    swiping.current = false;
    touchStart.current = null;
  }

  function closeActions() {
    setShowActions(false);
    setShowEmojiPicker(false);
  }

  return (
    <>
      {/* Backdrop dismisses mobile action bar on outside tap */}
      {showActions && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={closeActions} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-2 group px-2 sm:px-4 ${isOwn ? "flex-row-reverse" : "flex-row"} mb-1`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!isOwn && (
          <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
            {message.senderName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
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
            {/* Swipe-to-reply icon: left side for others, right side for own */}
            <AnimatePresence>
              {Math.abs(swipeX) > 20 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{
                    opacity: Math.abs(swipeX) / (SWIPE_THRESHOLD + 24),
                    scale: swipeReady ? 1.25 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className={`absolute ${
                    isOwn ? "-right-8" : "-left-8"
                  } top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message bubble — translates during swipe */}
            <div
              style={{
                transform: `translateX(${swipeX}px)`,
                transition: swipeX === 0 ? "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)" : "none",
              }}
            >
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
            </div>

            {/* ── Desktop action bar (hover, side) ──────────────────────── */}
            <AnimatePresence>
              {showActions && !isDeleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isOwn ? "-left-28" : "-right-28"
                  } hidden sm:flex items-center gap-1 bg-slate-800 border border-slate-700/50 rounded-xl p-1 shadow-lg z-50`}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Mobile action bar (long-press, above bubble) ───────────── */}
            <AnimatePresence>
              {showActions && !isDeleted && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className={`absolute bottom-full mb-2 flex sm:hidden items-center gap-1.5 bg-slate-800 border border-slate-700/50 rounded-xl p-1.5 shadow-xl z-50 ${
                    isOwn ? "right-0" : "left-0"
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                    className="w-10 h-10 flex items-center justify-center active:bg-slate-700 rounded-xl transition text-xl"
                  >
                    😊
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReply(message); closeActions(); }}
                    className="w-10 h-10 flex items-center justify-center active:bg-slate-700 rounded-xl transition text-slate-300"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Emoji picker (desktop + mobile) ───────────────────────── */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute bottom-full ${
                    // On mobile, clear the action bar (~52px tall + mb-2 = ~60px)
                    "mb-[62px] sm:mb-2"
                  } ${
                    isOwn ? "right-0" : "left-0"
                  } flex gap-1 bg-slate-800 border border-slate-700/50 rounded-xl p-2 shadow-lg z-[60] max-w-[calc(100vw-32px)]`}
                >
                  {EMOJI_SET.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact(message._id, emoji);
                        setShowEmojiPicker(false);
                        setShowActions(false);
                      }}
                      className="w-9 h-9 flex items-center justify-center hover:bg-slate-700 active:bg-slate-700 rounded-lg transition text-xl hover:scale-125 active:scale-110 transform"
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
    </>
  );
}
