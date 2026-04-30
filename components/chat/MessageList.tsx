"use client";

import { useEffect, useRef } from "react";
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
}

export function MessageList({
  messages,
  typingUsers,
  userName,
  onReply,
  onReact,
  onDelete,
  onSeen,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingUsers.length]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderName !== userName && !lastMsg.seenBy.includes(userName)) {
      onSeen(lastMsg._id);
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
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
        />
      ))}

      <TypingIndicator typingUsers={typingUsers.filter((u) => u !== userName)} />
      <div ref={bottomRef} />
    </div>
  );
}
