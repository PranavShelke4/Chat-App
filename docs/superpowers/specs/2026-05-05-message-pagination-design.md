# Message Pagination — Design Spec
Date: 2026-05-05

## Overview
Add "scroll up to load older messages" pagination so users can see the full chat history, not just the last 50 messages.

## Architecture

### API
- Join endpoint (`/api/rooms/join`) keeps returning last 50 messages unchanged
- New `GET /api/messages?roomCode=X&before=<messageId>&limit=50` fetches the next page of older messages
  - Sorted descending by `createdAt`, filtered to messages with `_id < before` cursor
  - Returns `{ messages: MessageDoc[], hasMore: boolean }`
  - `hasMore` is `true` if there are more messages before the oldest returned

### State (useRoom)
- Add `hasMore: boolean` (starts `true`)
- Add `loadingMore: boolean` (for spinner)
- Add `loadMoreMessages()` async function:
  - Takes the oldest current message `_id` as the `before` cursor
  - Calls `GET /api/messages?roomCode=X&before=<id>&limit=50`
  - Prepends results to messages array
  - Sets `hasMore = false` if fewer than 50 returned

### UI (MessageList)
- Scroll container gets a `ref`
- `onScroll` handler: when `scrollTop < 100px`, call `loadMoreMessages()` (debounced, only if not already loading and `hasMore` is true)
- Before prepending: capture `scrollHeight`
- After prepending: restore scroll position = `newScrollHeight - oldScrollHeight`
- Show a spinner at the top while `loadingMore` is true
- Show "Beginning of conversation" text when `hasMore` is false and messages exist

## Files Changed
- `app/api/messages/route.ts` — add GET handler for paginated messages
- `hooks/useRoom.ts` — add hasMore, loadingMore state and loadMoreMessages function
- `components/chat/MessageList.tsx` — add scroll detection, scroll restoration, spinner/beginning label
- `components/chat/ChatRoom.tsx` — pass loadMoreMessages/hasMore/loadingMore to MessageList
