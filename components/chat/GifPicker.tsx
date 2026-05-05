"use client";

import { useState, useEffect, useRef } from "react";

interface GifResult {
  id: string;
  images: {
    fixed_height_small: { url: string };
    original: { url: string };
  };
  title: string;
}

interface Props {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

export function GifPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchGifs("");
    return () => {
      clearTimeout(searchTimer.current);
      abortRef.current?.abort();
    };
  }, []);

  async function fetchGifs(q: string) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const url = q ? `/api/giphy?q=${encodeURIComponent(q)}` : `/api/giphy`;
      const res = await fetch(url, { signal: abortRef.current.signal });
      const json = await res.json();
      setGifs(json.data ?? []);
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") setGifs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchGifs(val), 400);
  }

  return (
    <div className="absolute bottom-full mb-2 right-0 w-72 sm:w-80 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl z-30 overflow-hidden">
      <div className="p-2.5 border-b border-slate-800">
        <input
          autoFocus
          value={query}
          onChange={handleSearch}
          placeholder="Search GIFs..."
          className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition"
        />
      </div>

      <div className="h-60 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No GIFs found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => { onSelect(gif.images.original.url); onClose(); }}
                className="rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500 transition aspect-video"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-2.5 py-1.5 border-t border-slate-800 flex justify-between items-center">
        <span className="text-xs text-slate-600">Powered by GIPHY</span>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-white transition">Close</button>
      </div>
    </div>
  );
}
