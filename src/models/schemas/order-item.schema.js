import { Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Item",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    variationId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    image: {
      img: {
        type: String,
        required: true,
        trim: true,
      },
      imgDesc: {
        type: String,
        required: true,
        trim: true,
      },
    },
    affiliateCode: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

export default OrderItemSchema;