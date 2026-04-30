"use client";

import Image from "next/image";
import { MessageDoc } from "@/types";

export function MediaPreview({ message }: { message: MessageDoc }) {
  if (message.type === "image") {
    return (
      <a href={message.content} target="_blank" rel="noopener noreferrer" className="block">
        <Image
          src={message.content}
          alt="Shared image"
          width={300}
          height={200}
          className="rounded-xl object-cover max-h-64 w-auto cursor-zoom-in hover:opacity-90 transition"
          unoptimized
        />
      </a>
    );
  }

  if (message.type === "video") {
    return (
      <video
        src={message.content}
        controls
        className="rounded-xl max-w-xs max-h-64 bg-black"
      />
    );
  }

  if (message.type === "audio") {
    return (
      <div className="flex flex-col gap-1 min-w-[200px]">
        <p className="text-xs text-slate-400 truncate">{message.fileName || "Audio"}</p>
        <audio src={message.content} controls className="w-full h-8" />
      </div>
    );
  }

  return (
    <a
      href={message.content}
      target="_blank"
      rel="noopener noreferrer"
      download={message.fileName}
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/40 transition min-w-[200px]"
    >
      <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-white font-medium truncate">{message.fileName || "File"}</p>
        <p className="text-xs text-slate-500">Click to download</p>
      </div>
    </a>
  );
}
