# Chat UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four UX improvements: remove redundant emoji button, scroll-to-original on reply tap, Instagram reel link cards, and a GIPHY GIF picker.

**Architecture:** All changes are isolated to the chat UI layer. GIFs are sent as text messages containing a GIPHY CDN URL (no new message types). Instagram detection is a pure text utility. Scroll-to-reply uses data attributes + querySelector. A `/api/giphy` proxy keeps the API key server-side.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `components/chat/MessageInput.tsx` | Modify | Remove emoji button/state, add GIF button |
| `components/chat/MessageBubble.tsx` | Modify | Add data-message-id, scroll prop, Instagram card, GIF image render |
| `components/chat/MessageList.tsx` | Modify | Implement scrollToMessage, pass to MessageBubble |
| `components/chat/GifPicker.tsx` | Create | GIPHY search UI component |
| `app/api/giphy/route.ts` | Create | Server-side GIPHY proxy |
| `.env.local` | Modify | Add GIPHY_API_KEY placeholder |

---

### Task 1: Remove Emoji Button from MessageInput

**Files:**
- Modify: `components/chat/MessageInput.tsx`

- [ ] **Step 1: Remove emoji state, import, and button**

In `components/chat/MessageInput.tsx`, make these changes:

Remove line 4: `import dynamic from "next/dynamic";`
Remove line 8: `const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });`
Remove line 31: `const [showEmoji, setShowEmoji] = useState(false);`

Remove the emoji button (lines 170–175):
```tsx
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="absolute right-2.5 bottom-2.5 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-violet-400 transition text-base"
          >
            😊
          </button>
```

Remove the EmojiPicker popup (lines 189–201):
```tsx
      {showEmoji && (
        <div className="absolute bottom-24 right-3 sm:right-4 z-30">
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
```

Also update the textarea `className` — remove `pr-11` from the padding since the emoji button is gone, change to `pr-4`:
```tsx
className="w-full resize-none bg-slate-800 border border-slate-700/50 rounded-2xl px-4 py-3 pr-4 text-white placeholder-slate-500 text-sm leading-5 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition max-h-32 overflow-y-auto"
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "D:\Personal Project\nextjs-chat" && npx tsc --noEmit
```
Expected: no errors related to MessageInput.

- [ ] **Step 3: Commit**

```bash
git add components/chat/MessageInput.tsx
git commit -m "feat: remove redundant emoji button from message input"
```

---

### Task 2: Add Scroll-to-Original on Reply Tap

**Files:**
- Modify: `components/chat/MessageBubble.tsx`
- Modify: `components/chat/MessageList.tsx`

- [ ] **Step 1: Add `data-message-id` and `onScrollToMessage` prop to MessageBubble**

In `components/chat/MessageBubble.tsx`:

Update the `Props` interface (around line 14) to add the new prop:
```tsx
interface Props {
  message: MessageDoc;
  isOwn: boolean;
  userName: string;
  onReply: (msg: MessageDoc) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onScrollToMessage: (id: string) => void;
}
```

Update the function signature (line 23):
```tsx
export function MessageBubble({ message, isOwn, userName, onReply, onReact, onDelete, onScrollToMessage }: Props) {
```

Add `data-message-id` to the outer `motion.div` (around line 121):
```tsx
      <motion.div
        data-message-id={message._id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-2 group px-2 sm:px-4 ${isOwn ? "flex-row-reverse" : "flex-row"} mb-1`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
```

Make the reply preview block clickable (around lines 142–153). Replace the existing `<div>` with:
```tsx
          {message.replyTo && (
            <button
              onClick={() => onScrollToMessage((message.replyTo as any)._id)}
              className={`text-xs text-slate-400 border-l-2 border-violet-500/60 pl-2 mb-1 truncate max-w-full text-left hover:text-violet-300 transition ${
                isOwn ? "text-right border-r-2 border-l-0 pr-2" : ""
              }`}
            >
              ↩ {(message.replyTo as any).senderName}:{" "}
              {(message.replyTo as any).deletedAt
                ? "Deleted"
                : (message.replyTo as any).content?.slice(0, 40)}
            </button>
          )}
```

- [ ] **Step 2: Implement scrollToMessage in MessageList**

In `components/chat/MessageList.tsx`:

Update the `Props` interface to add `onScrollToMessage`:
```tsx
interface Props {
  messages: MessageDoc[];
  typingUsers: string[];
  userName: string;
  onReply: (msg: MessageDoc) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onSeen: (messageId: string) => void;
  onScrollToMessage?: (id: string) => void;
}
```

Update the destructure:
```tsx
export function MessageList({
  messages,
  typingUsers,
  userName,
  onReply,
  onReact,
  onDelete,
  onSeen,
  onScrollToMessage,
}: Props) {
```

Add the handler after the existing `useEffect` hooks (after line 43):
```tsx
  function handleScrollToMessage(id: string) {
    const el = document.querySelector(`[data-message-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-violet-400", "rounded-2xl");
    setTimeout(() => el.classList.remove("ring-2", "ring-violet-400", "rounded-2xl"), 1200);
  }
```

Pass it to each `MessageBubble` (in the `.map` around line 62):
```tsx
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
        />
      ))}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "D:\Personal Project\nextjs-chat" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/chat/MessageBubble.tsx components/chat/MessageList.tsx
git commit -m "feat: scroll to original message when tapping reply preview"
```

---

### Task 3: Instagram Reel Link Card

**Files:**
- Modify: `components/chat/MessageBubble.tsx`

- [ ] **Step 1: Add Instagram URL detector utility inline in MessageBubble**

At the top of `components/chat/MessageBubble.tsx`, after the imports, add this function:

```tsx
function detectInstagramUrl(text: string): string | null {
  const match = text.match(
    /https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?(\?[^\s]*)?\S*/
  );
  return match ? match[0] : null;
}
```

- [ ] **Step 2: Render Instagram card in text messages**

In `MessageBubble`, find the text message render (around line 196):
```tsx
                ) : message.type === "text" ? (
                  <span className="whitespace-pre-wrap">{message.content}</span>
                ) : (
```

Replace the text branch with:
```tsx
                ) : message.type === "text" ? (
                  <>
                    <span className="whitespace-pre-wrap">{message.content}</span>
                    {(() => {
                      const igUrl = detectInstagramUrl(message.content);
                      if (!igUrl) return null;
                      return (
                        <a
                          href={igUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2.5 mt-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-orange-500/30 border border-pink-500/30 hover:border-pink-400/60 transition"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#E1306C" }}>
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                          </svg>
                          <span className="text-xs font-medium text-pink-200">Open in Instagram</span>
                          <svg className="w-3.5 h-3.5 ml-auto text-pink-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      );
                    })()}
                  </>
                ) : (
```

- [ ] **Step 3: Also render GIF URLs as images in text messages**

Update the `detectInstagramUrl` step above to also add a GIF detector. Add this function right below `detectInstagramUrl`:

```tsx
function detectGifUrl(text: string): string | null {
  const trimmed = text.trim();
  if (
    /^https?:\/\/media\d*\.giphy\.com\/media\/[A-Za-z0-9]+\/giphy\.gif(\?[^\s]*)?$/.test(trimmed) ||
    /^https?:\/\/i\.giphy\.com\/[A-Za-z0-9]+\.gif(\?[^\s]*)?$/.test(trimmed)
  ) {
    return trimmed;
  }
  return null;
}
```

Then update the text message branch to check for GIF first:
```tsx
                ) : message.type === "text" ? (
                  (() => {
                    const gifUrl = detectGifUrl(message.content);
                    if (gifUrl) {
                      return (
                        <img
                          src={gifUrl}
                          alt="GIF"
                          className="rounded-xl max-w-xs max-h-48 object-cover"
                          loading="lazy"
                        />
                      );
                    }
                    const igUrl = detectInstagramUrl(message.content);
                    return (
                      <>
                        <span className="whitespace-pre-wrap">{message.content}</span>
                        {igUrl && (
                          <a
                            href={igUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2.5 mt-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-orange-500/30 border border-pink-500/30 hover:border-pink-400/60 transition"
                          >
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#E1306C" }}>
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                            </svg>
                            <span className="text-xs font-medium text-pink-200">Open in Instagram</span>
                            <svg className="w-3.5 h-3.5 ml-auto text-pink-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </>
                    );
                  })()
                ) : (
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "D:\Personal Project\nextjs-chat" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/chat/MessageBubble.tsx
git commit -m "feat: add Instagram reel card and GIF URL rendering in messages"
```

---

### Task 4: GIPHY API Proxy Route

**Files:**
- Create: `app/api/giphy/route.ts`
- Modify: `.env.local`

- [ ] **Step 1: Add GIPHY_API_KEY to .env.local**

Append to `.env.local`:
```
GIPHY_API_KEY=your_giphy_api_key_here
```

- [ ] **Step 2: Create GIPHY proxy route**

Create `app/api/giphy/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";

const GIPHY_BASE = "https://api.giphy.com/v1/gifs";
const API_KEY = process.env.GIPHY_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const limit = "20";

  const endpoint = q
    ? `${GIPHY_BASE}/search?api_key=${API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g`
    : `${GIPHY_BASE}/trending?api_key=${API_KEY}&limit=${limit}&rating=g`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return NextResponse.json({ data: [] }, { status: res.status });
    const json = await res.json();
    return NextResponse.json({ data: json.data });
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "D:\Personal Project\nextjs-chat" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/giphy/route.ts .env.local
git commit -m "feat: add GIPHY proxy API route"
```

---

### Task 5: GifPicker Component

**Files:**
- Create: `components/chat/GifPicker.tsx`

- [ ] **Step 1: Create GifPicker component**

Create `components/chat/GifPicker.tsx`:
```tsx
"use client";

import { useState, useEffect, useRef } from "react";

interface GifResult {
  id: string;
  images: {
    fixed_height_small: { url: string; width: string; height: string };
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
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    fetchGifs("");
  }, []);

  async function fetchGifs(q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/giphy?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setGifs(json.data ?? []);
    } catch {
      setGifs([]);
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "D:\Personal Project\nextjs-chat" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/chat/GifPicker.tsx
git commit -m "feat: add GifPicker component with GIPHY search"
```

---

### Task 6: Wire GIF Button into MessageInput

**Files:**
- Modify: `components/chat/MessageInput.tsx`

- [ ] **Step 1: Add GIF button and GifPicker to MessageInput**

In `components/chat/MessageInput.tsx`, add the GifPicker import at the top:
```tsx
import { GifPicker } from "./GifPicker";
```

Add GIF picker state after the existing state declarations (after `isTyping`):
```tsx
  const [showGifPicker, setShowGifPicker] = useState(false);
```

Add the GIF button to the toolbar. Place it between the file attachment button and the textarea `<div>`. After the `<input ref={fileRef} .../>` and before `<div className="flex-1 relative min-w-0">`:

```tsx
        <button
          onClick={() => setShowGifPicker((p) => !p)}
          disabled={uploading}
          className="w-10 h-10 sm:w-9 sm:h-9 flex-shrink-0 self-end sm:self-auto flex items-center justify-center rounded-2xl sm:rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white transition disabled:opacity-50 text-xs font-bold"
        >
          GIF
        </button>
```

Wrap the outer `<div className="flex items-center gap-2 p-2.5 sm:p-3">` in a `relative` wrapper, and add the GifPicker inside that same wrapper (before the closing `</div>` of the outer `sticky` container):

Replace the outermost `<div className="sticky bottom-0 ...">` opening to add `relative` positioning context (it already has `relative` — confirmed in source line 101). Then add the GifPicker just before the closing `</div>` of the sticky container:

```tsx
      {showGifPicker && (
        <div className="absolute bottom-full right-0 left-0 flex justify-end px-2.5 sm:px-3">
          <GifPicker
            onSelect={(url) => {
              onSend({ type: "text", content: url, replyTo: replyTo?._id });
              onCancelReply();
            }}
            onClose={() => setShowGifPicker(false)}
          />
        </div>
      )}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "D:\Personal Project\nextjs-chat" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/chat/MessageInput.tsx
git commit -m "feat: add GIF picker button to message input toolbar"
```

---

## Self-Review

**Spec coverage:**
- ✅ Remove emoji button — Task 1
- ✅ Scroll to original message on reply tap — Task 2
- ✅ Instagram reel link card — Task 3
- ✅ GIF picker (GIPHY) — Tasks 4, 5, 6
- ✅ GIF messages render as images — Task 3 (detectGifUrl)
- ✅ GIPHY API key server-side only — Task 4 (proxy route)

**Placeholder scan:** No TBD/TODO. All code blocks are complete.

**Type consistency:**
- `onScrollToMessage: (id: string) => void` — defined in Task 2 MessageBubble Props, used in Task 2 MessageList
- `GifResult` interface — defined and used within Task 5 only
- `detectGifUrl` / `detectInstagramUrl` — defined and used in Task 3 only
- All consistent.
