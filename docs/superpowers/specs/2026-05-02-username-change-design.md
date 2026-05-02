# Username Change with Admin Persistence

**Date:** 2026-05-02  
**Status:** Approved

## Summary

Allow any user to change their display name while inside a room. If the user is the room admin, their admin status persists after the rename by updating the room's `adminName` field in the database. All previous messages from the user are also updated to reflect the new name. The change is silent (no system message broadcast).

---

## Architecture

The feature is built on the existing name-based identity model — no session tokens or persistent user accounts are introduced. Admin identity continues to be tracked via `room.adminName` (a string), but a rename operation atomically updates that field alongside all affected messages, so the string remains valid after the change.

---

## API

### `PATCH /api/rooms/rename`

**Request body:**
```json
{
  "roomCode": "ABC123",
  "oldName": "Pranav",
  "newName": "Pran"
}
```

**Server logic (in order):**
1. Find room by `roomCode`
2. Bulk-update all messages in that room: `senderName: oldName → newName`
3. If `room.adminName === oldName`, set `room.adminName = newName`
4. Fire Pusher event `member-renamed` with `{ oldName, newName }` on `presence-room-${roomCode}`
5. Return `{ success: true }`

**Validation:**
- `newName` must be non-empty and trimmed
- `newName` must differ from `oldName`
- Room must exist

No admin-only restriction — any member can rename themselves.

---

## Client State & URL Management

After a successful rename API call, the client updates three locations:

| Location | What changes |
|---|---|
| React state | `userName` is promoted from a static prop to mutable state in `ChatRoom` so it can update without a page reload |
| URL param | `router.replace('/room/CODE?name=NewName')` — no history entry, no reload |
| localStorage | `lib/localRooms.ts` room entry updated so quick-rejoin uses the new name |

All connected clients listen for the `member-renamed` Pusher event and refresh the member sidebar live.

---

## UI

### Settings button in `RoomHeader`

A settings icon button is added to `RoomHeader`, visible to all users (not admin-only). Positioned next to the existing admin security button.

### `EditNameModal` component

A new modal component (`components/chat/EditNameModal.tsx`) controlled by a boolean state flag in `ChatRoom`.

**Contents:**
- Text input pre-filled with current username
- **Save** button — disabled when field is empty or unchanged
- **Cancel** button
- Loading state while API call is in flight

**Behavior:**
- On save success: updates state/URL/localStorage, closes modal
- On save error: shows a toast notification, modal stays open

---

## Files Changed

| File | Change |
|---|---|
| `app/api/rooms/rename/route.ts` | New — PATCH endpoint |
| `components/chat/EditNameModal.tsx` | New — rename modal component |
| `components/chat/RoomHeader.tsx` | Add settings button, wire modal open |
| `components/chat/ChatRoom.tsx` | Promote `userName` to state, handle rename, pass setter down |
| `hooks/useRoom.ts` | Listen for `member-renamed` Pusher event, update member list |
| `lib/localRooms.ts` | Add `updateRoomUserName(code, newName)` helper |
| `lib/socketEvents.ts` | Add `MEMBER_RENAMED` event constant |

---

## Out of Scope

- Multi-admin support
- Persistent user accounts / session tokens
- System message broadcast on rename
- Conflict detection if two members share the same name
