import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const NewsletterSchema = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/.+@.+\..+/, "Email format is invalid"],
    },
    acceptance: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

NewsletterSchema.index({ createdAt: -1 });

export default model("Newsletter", NewsletterSchema);