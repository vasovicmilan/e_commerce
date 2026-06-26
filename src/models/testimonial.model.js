import { Schema, model } from "mongoose";

const TestimonialSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    displayName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    avatar: {
      type: String,
      trim: true,
      default: "",
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },

    product: {
      itemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        default: null,
      },
      name: {
        type: String,
        trim: true,
        default: "",
      },
      slug: {
        type: String,
        trim: true,
        default: "",
      },
    },

    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

TestimonialSchema.index({ rating: -1 });
TestimonialSchema.index({ isApproved: 1, isFeatured: 1, createdAt: -1 });
TestimonialSchema.index({ "product.itemId": 1 });
TestimonialSchema.index({ user: 1, "product.itemId": 1 }, { unique: true, sparse: true });

export default model("Testimonial", TestimonialSchema);