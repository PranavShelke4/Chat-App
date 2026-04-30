import { MessageDoc } from "@/types";

export function SystemMessage({ message }: { message: MessageDoc }) {
  return (
    <div className="flex justify-center my-2">
      <span className="text-xs text-slate-500 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800/50">
        {message.content}
      </span>
    </div>
  );
}
