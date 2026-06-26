import { Schema, model } from "mongoose";

const ContactSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    telephoneNumber: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
      required: true,
    },
    acceptance: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ createdAt: -1 });

export default model("Contact", ContactSchema);