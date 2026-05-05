# Chat UX Improvements — Design Spec
Date: 2026-05-05

## Overview
Four focused UX improvements to the chat UI: remove redundant emoji button, scroll-to-reply navigation, Instagram reel link cards, and a GIPHY GIF picker.

## 1. Remove Emoji Button from MessageInput
- Remove the `😊` button (absolute-positioned inside textarea), `showEmoji` state, and `EmojiPicker` dynamic import from `MessageInput.tsx`
- Phone keyboards already provide emoji input — this avoids the redundant full-screen picker

## 2. Scroll-to-Original on Reply Tap
- Add `data-message-id={message._id}` to the outer `motion.div` in `MessageBubble.tsx`
- Reply preview block gains `onClick` that calls a new `onScrollToMessage(id: string)` prop
- `MessageList` implements `handleScrollToMessage`: queries `[data-message-id="..."]`, calls `scrollIntoView({ behavior: "smooth", block: "center" })`, then adds/removes a `ring-2 ring-violet-400` flash class for 1.2s
- Props chain: `MessageList` → `onScrollToMessage` → `MessageBubble`

## 3. Instagram Link Detection Card
- Utility `detectInstagramUrl(text: string): string | null` — regex matches `instagram.com/reel/`, `/p/`, `/tv/`
- In `MessageBubble`, text messages with a detected Instagram URL render an additional card below the text:
  - Instagram gradient background, logo icon, "Open in Instagram" label
  - `href` is the original URL; mobile browsers open Instagram app if installed
- Covers reel, post, and TV links

## 4. GIF Picker via GIPHY
- New `GifPicker` component: search input + scrollable grid of GIF thumbnails
- Appears above input bar (same z-layer as old emoji picker); closes on outside tap
- Toolbar: new GIF button next to the attachment button (replaces no slot — just adds one)
- Selecting a GIF calls `onSend({ type: "text", content: gifUrl })` — URL of the GIF
- `MessageBubble` text renderer detects `.gif` URLs (or giphy CDN domain) and renders as `<img>` instead of plain text
- API key stored as `NEXT_PUBLIC_GIPHY_API_KEY` in `.env.local` (placeholder added)
- GIPHY search hits `/api/giphy?q=...` proxy route so key is server-side only; trending shown on open

## Data Flow
- No schema changes — GIFs are sent as text messages containing a URL
- No new message types
- `onScrollToMessage` is a new prop on `MessageBubble` and `MessageList`

## Files Changed
- `components/chat/MessageInput.tsx` — remove emoji button, add GIF button
- `components/chat/MessageBubble.tsx` — add data-message-id, scroll-to prop, Instagram card, GIF img render
- `components/chat/MessageList.tsx` — add scrollToMessage handler, pass to bubbles
- `components/chat/GifPicker.tsx` — new component
- `app/api/giphy/route.ts` — new proxy route
- `.env.local` — add NEXT_PUBLIC_GIPHY_API_KEY placeholder (actually key is server-side, so GIPHY_API_KEY)
