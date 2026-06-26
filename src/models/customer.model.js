import { Schema as _Schema, model } from "mongoose";
import TelephoneSchema from "./schemas/telephone.schema.js";
import AddressSchema from "./schemas/address.schema.js";

const Schema = _Schema;

export const CustomerSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/.+@.+\..+/, "Email format is invalid"],
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

    acceptance: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ "addresses.city": 1 });

export default model("Customer", CustomerSchema);