import { Schema, model } from "mongoose";

export const HISTORY_TYPES = [
  "earnings",
  "withdrawal",
  "level_up",
  "bonus",
  "adjustment",
  "shop_activation",
  "offer_created",
];

const HistorySchema = new Schema(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: HISTORY_TYPES,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

HistorySchema.index({ partnerId: 1, createdAt: -1 });

export default model("History", HistorySchema);