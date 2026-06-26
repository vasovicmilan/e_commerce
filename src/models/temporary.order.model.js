import { Schema, model } from "mongoose";
import OrderItemSchema from "./schemas/order-item.schema.js";
import TelephoneSchema from "./schemas/telephone.schema.js";
import AddressSchema from "./schemas/address.schema.js";

const TemporaryOrderSchema = new Schema(
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
        message: "Temporary order must contain at least one item",
      },
    },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
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
    createNewAccount: { type: Boolean, default: false },
    hasNewTelephone: { type: Boolean, default: false },
    hasNewAddress: { type: Boolean, default: false },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenExpiration: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

TemporaryOrderSchema.index({ "buyerInfo.email": 1, createdAt: -1 });
TemporaryOrderSchema.index({ buyerId: 1 });
TemporaryOrderSchema.index({ buyerModel: 1 });
TemporaryOrderSchema.index({ "items.itemId": 1 });
TemporaryOrderSchema.index({ "coupon.couponId": 1 });
TemporaryOrderSchema.index({ "telephone.hash": 1 });
TemporaryOrderSchema.index({ "address.hash": 1 });
TemporaryOrderSchema.index({ "partner.partnerId": 1 });

export default model("TemporaryOrder", TemporaryOrderSchema);