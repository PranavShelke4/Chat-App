"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { MessageDoc, UploadResult } from "@/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface Props {
  onSend: (payload: {
    type: string;
    content: string;
    fileName?: string;
    replyTo?: string;
  }) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyTo: MessageDoc | null;
  onCancelReply: () => void;
}

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
}: Props) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();
  const isTyping = useRef(false);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    if (!isTyping.current) {
      onTypingStart();
      isTyping.current = true;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      onTypingStop();
      isTyping.current = false;
    }, 1500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }

  function handleSendText() {
    if (!text.trim()) return;
    onSend({ type: "text", content: text.trim(), replyTo: replyTo?._id });
    setText("");
    onCancelReply();
    clearTimeout(typingTimer.current);
    onTypingStop();
    isTyping.current = false;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data: UploadResult = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Upload failed");
      onSend({
        type: data.type,
        content: data.url,
        fileName: data.fileName,
        replyTo: replyTo?._id,
      });
      onCancelReply();
      toast.success("File sent!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  useEffect(() => {
    return () => clearTimeout(typingTimer.current);
  }, []);

  return (
    <div className="border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md relative">
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/40">
          <div className="flex-1 text-xs text-slate-400 border-l-2 border-violet-500 pl-2 truncate">
            <span className="text-violet-400 font-medium">{replyTo.senderName}</span>:{" "}
            {replyTo.deletedAt ? "Deleted message" : replyTo.content.slice(0, 60)}
          </div>
          <button
            onClick={onCancelReply}
            className="text-slate-500 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {uploading && (
        <div className="px-4 py-2 bg-violet-600/10 border-b border-violet-500/20">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-violet-400">{uploadProgress}</span>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)"
            rows={1}
            className="w-full resize-none bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5 pr-10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition max-h-32 overflow-y-auto"
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="absolute right-2 bottom-2.5 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-violet-400 transition text-base"
          >
            😊
          </button>
        </div>

        <button
          onClick={handleSendText}
          disabled={!text.trim() || uploading}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-violet-900/30"
        >
          <svg className="w-4 h-4 rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {showEmoji && (
        <div className="absolute bottom-20 right-4 z-30">
          <EmojiPicker
            onEmojiClick={(e) => {
              setText((p) => p + e.emoji);
              setShowEmoji(false);
            }}
            theme={"dark" as any}
            height={350}
            width={300}
          />
        </div>
      )}
    </div>
  );
}
