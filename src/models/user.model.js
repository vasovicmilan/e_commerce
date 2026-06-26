import { Schema, model } from "mongoose";
import TelephoneSchema from "./schemas/telephone.schema.js";
import AddressSchema from "./schemas/address.schema.js";
import PartnerSchema from "./schemas/partner.schema.js";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/.+@.+\..+/, "Email format is invalid"],
    },

    password: {
      type: String,
      required: false,
      minlength: 8,
      select: false,
    },

    firstName: {
      type: String,
      required: true,
      minlength: 2,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      minlength: 2,
      trim: true,
    },

    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "pending",
      required: true,
    },

    telephoneNumbers: {
      type: [TelephoneSchema],
      default: [],
    },

    addresses: {
      type: [AddressSchema],
      default: [],
    },

    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    cart: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        variationId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        title: { type: String, required: true },
        image: {
          img: { type: String, required: true, trim: true },
          imgDesc: { type: String, required: true, trim: true },
        },
        size: { type: String, required: true },
        color: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        price: { type: String, required: true },
        code: { type: String },
      },
    ],

    partner: {
      type: PartnerSchema,
      default: () => ({}),
    },

    resetToken: String,
    resetTokenExpiration: Date,

    confirmToken: String,
    confirmTokenExpiration: Date,

    acceptance: { type: Boolean, default: true, required: true },
    confirmed: { type: Boolean, default: false },
    lastLogin: Date,
  },
  { timestamps: true }
);

UserSchema.index({ lastLogin: -1 });
UserSchema.index({ role: 1 });

export default model("User", UserSchema);