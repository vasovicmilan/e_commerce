import { Schema } from "mongoose";

const WishlistItemSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: true }
);

export default WishlistItemSchema;