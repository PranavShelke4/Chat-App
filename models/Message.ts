import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReaction {
  emoji: string;
  names: string[];
}

export interface IMessage extends Document {
  roomCode: string;
  senderName: string;
  type: "text" | "image" | "video" | "file" | "audio" | "system";
  content: string;
  fileName?: string;
  replyTo?: Types.ObjectId;
  reactions: IReaction[];
  deletedAt?: Date;
  seenBy: string[];
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    roomCode: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "image", "video", "file", "audio", "system"],
      default: "text",
    },
    content: { type: String, required: true },
    fileName: { type: String },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    reactions: [
      {
        emoji: String,
        names: [String],
      },
    ],
    deletedAt: { type: Date, default: null },
    seenBy: [{ type: String }],
  },
  { timestamps: true }
);

export const Message =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
