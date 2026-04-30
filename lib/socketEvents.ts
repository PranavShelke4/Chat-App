export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  SEND_MESSAGE: "send-message",
  TYPING_START: "typing-start",
  TYPING_STOP: "typing-stop",
  ADD_REACTION: "add-reaction",
  DELETE_MESSAGE: "delete-message",
  SEEN_MESSAGE: "seen-message",

  // Client → Server (admin actions)
  KICK_MEMBER: "kick-member",

  // Server → Client
  ROOM_ERROR: "room-error",
  KICKED: "kicked",
  ROOM_JOINED: "room-joined",
  NEW_MESSAGE: "new-message",
  MEMBER_JOINED: "member-joined",
  MEMBER_LEFT: "member-left",
  TYPING_UPDATE: "typing-update",
  REACTION_UPDATED: "reaction-updated",
  MESSAGE_DELETED: "message-deleted",
  MESSAGE_SEEN: "message-seen",
} as const;
