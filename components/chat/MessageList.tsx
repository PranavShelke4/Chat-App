"use client";

import { useEffect, useRef, useState } from "react";
import { MessageDoc } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface Props {
  messages: MessageDoc[];
  typingUsers: string[];
  userName: string;
  onReply: (msg: MessageDoc) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onSeen: (messageId: string) => void;
  onScrollToMessage?: (id: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: (oldestMessageId: string) => void;
}

export function MessageList({
  messages,
  typingUsers,
  userName,
  onReply,
  onReact,
  onDelete,
  onSeen,
  onScrollToMessage,
  hasMore,
  loadingMore,
  onLoadMore,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingUsers.length]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg &&
      lastMsg.type !== "system" &&
      lastMsg.senderName !== userName &&
      !lastMsg.seenBy.includes(userName)
    ) {
      onSeen(lastMsg._id);
    }
  }, [messages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prevScrollHeightRef.current === 0) return;
    const diff = container.scrollHeight - prevScrollHeightRef.current;
    if (diff > 0) container.scrollTop += diff;
    prevScrollHeightRef.current = 0;
  }, [messages.length]);

  function handleScrollToMessage(id: string) {
    const el = document.querySelector(`[data-message-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    setTimeout(() => setHighlightedId(null), 1200);
  }

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop < 100 && hasMore && !loadingMore && messages.length > 0) {
      prevScrollHeightRef.current = container.scrollHeight;
      onLoadMore(messages[0]._id);
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto py-3 sm:py-4 px-2 sm:px-4 space-y-0.5"
    >
      {loadingMore && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <div className="flex items-center gap-3 py-3 px-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600 flex-shrink-0">Beginning of conversation</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 sm:p-8">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/60 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-slate-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No messages yet. Say hello!</p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isOwn={msg.senderName === userName}
          userName={userName}
          onReply={onReply}
          onReact={onReact}
          onDelete={onDelete}
          onScrollToMessage={onScrollToMessage ?? handleScrollToMessage}
          highlighted={highlightedId === msg._id}
        />
      ))}

      <TypingIndicator typingUsers={typingUsers.filter((u) => u !== userName)} />
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
