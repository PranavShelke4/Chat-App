import mongoose, { Schema, Document } from "mongoose";

export interface IPushSubscription extends Document {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userName: string;
  roomCode: string;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userName: { type: String, required: true },
    roomCode: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ endpoint: 1, roomCode: 1 }, { unique: true });

export const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
