import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  code: string;
  name: string;
  adminName: string;
  password: string | null;
  locked: boolean;
  createdAt: Date;
  lastActivity: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    adminName: { type: String, required: true },
    password: { type: String, default: null },
    locked: { type: Boolean, default: false },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RoomSchema.index({ lastActivity: 1 });

export const Room = mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
