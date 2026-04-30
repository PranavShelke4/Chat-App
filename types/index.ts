export interface RoomDoc {
  _id: string;
  code: string;
  name: string;
  adminName: string;
  createdAt: string;
  lastActivity: string;
}

export interface Reaction {
  emoji: string;
  names: string[];
}

export interface MessageDoc {
  _id: string;
  roomCode: string;
  senderName: string;
  type: "text" | "image" | "video" | "file" | "audio" | "system";
  content: string;
  fileName?: string;
  replyTo?: MessageDoc | null;
  reactions: Reaction[];
  deletedAt?: string | null;
  seenBy: string[];
  createdAt: string;
}

export interface Member {
  name: string;
  socketId: string;
  joinedAt: string;
}

export interface RoomState {
  room: RoomDoc | null;
  messages: MessageDoc[];
  members: Member[];
  typingUsers: string[];
}

export interface UploadResult {
  url: string;
  type: "image" | "video" | "file" | "audio";
  fileName: string;
}
