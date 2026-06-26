import { Schema } from "mongoose";

const ContentBlockSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["heading", "paragraph", "list", "table", "image", "quote"],
    },
    text: { type: String, trim: true },
    level: { type: Number, min: 1, max: 6 },
    items: [{ type: String, trim: true }],
    rows: [[{ type: String, trim: true }]],
    src: { type: String, trim: true },
    alt: { type: String, trim: true },
  },
  { _id: false }
);

export default ContentBlockSchema;