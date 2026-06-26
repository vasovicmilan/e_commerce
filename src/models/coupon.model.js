import { Schema, model } from "mongoose";

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // GLOBALNI LIMIT – ukupan broj korišćenja (null = neograničeno)
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // 🔥 IZMENA: default null (neograničeno po korisniku)
    usagePerUser: {
      type: Number,
      default: null,
      min: 1,
    },
    minCartAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    allowedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    usedBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        temporaryOrderId: {
          type: Schema.Types.ObjectId,
          ref: "TemporaryOrder",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        orderId: {
          type: Schema.Types.ObjectId,
          ref: "Order",
        },
      },
    ],
  },
  { timestamps: true }
);

CouponSchema.index({ isActive: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1 });
CouponSchema.index({ createdAt: -1 });

export default model("Coupon", CouponSchema);