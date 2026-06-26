import { Schema } from "mongoose";
import { SIZES } from "../constants.js";

const BackOrderItemSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    size: {
      type: String,
      enum: SIZES,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: true }
);

const BackOrderSchema = new Schema(
  {
    isAllowed: {
      type: Boolean,
      default: false,
    },
    orders: {
      type: [BackOrderItemSchema],
      default: [],
    },
  },
  { _id: false }
);

export default BackOrderSchema;