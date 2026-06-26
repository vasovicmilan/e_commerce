import { Schema, model } from "mongoose";
import ContentBlockSchema from "./schemas/content.block.schema.js";
import FaqSchema from "./schemas/faq.schema.js";

const PostSchema = new Schema(
  {
    // INFO: Phase 1 Basic
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["not-published", "published", "featured"],
      default: "not-published",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    featureImage: {
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
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    // INFO: Phase 2 Content
    content: {
      type: [ContentBlockSchema],
      default: [],
    },

    // INFO: Phase 3 SEO
    description: {
      type: String,
      default: "",
      trim: true,
    },
    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },
    keyWords: [
      {
        type: String,
        trim: true,
      },
    ],
    faq: {
      type: [FaqSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ status: 1 });
PostSchema.index({ categories: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });

PostSchema.index(
  {
    title: "text",
    description: "text",
    shortDescription: "text",
    keyWords: "text",
  },
  {
    weights: {
      title: 10,
      description: 5,
      shortDescription: 3,
      keyWords: 2,
    },
  }
);

export default model("Post", PostSchema);