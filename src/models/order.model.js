import { Schema, model } from "mongoose";
import OrderItemSchema from "./schemas/order-item.schema.js";
import TelephoneSchema from "./schemas/telephone.schema.js";
import AddressSchema from "./schemas/address.schema.js";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "returned",
  "refunded",
  "failed",
];

const OrderSchema = new Schema(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "buyerModel",
    },
    buyerModel: {
      type: String,
      required: true,
      enum: ["User", "Customer"],
    },
    buyerInfo: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
    },
    telephone: {
      type: TelephoneSchema,
      required: true,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    shipping: { type: Number, min: 0, default: 0 },
    coupon: {
      couponId: { type: Schema.Types.ObjectId, ref: "Coupon" },
      code: { type: String, trim: true },
      discount: { type: Number, min: 0, default: 0 },
    },
    partner: {
      partnerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      source: {
        type: String,
        enum: ["direct", "affiliate_link", "partner_shop", "coupon"],
        default: "direct",
      },
    },
    totalPrice: { type: Number, required: true, min: 0, default: 0 },
    note: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    cancelToken: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    returnedAt: Date,
    refundedAt: Date,
    temporaryOrderId: {
      type: Schema.Types.ObjectId,
      ref: "TemporaryOrder",
    },
  },
  { timestamps: true }
);

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "buyerInfo.email": 1 });
OrderSchema.index({ "address.city": 1 });
OrderSchema.index({ "telephone.hash": 1 });
OrderSchema.index({ "address.hash": 1 });
OrderSchema.index({ "partner.partnerId": 1 });

export default model("Order", OrderSchema);