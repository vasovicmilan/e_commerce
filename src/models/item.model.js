import { Schema, model } from "mongoose";
import VideoSchema from "./schemas/video.schema.js";
import VariationSchema from "./schemas/variation.schema.js";
import PartnerItemSchema from "./schemas/partner.item.schema.js";
import BackOrderSchema from "./schemas/backorder.schema.js";
import WishlistItemSchema from "./schemas/wishlist.schema.js";
import FaqSchema from "./schemas/faq.schema.js";
import RatingSchema from "./schemas/rating.schema.js";
import { ITEM_STATUSES } from "./constants.js";

const ItemSchema = new Schema(
  {
    // INFO: Phase 1 Basic info
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    featureImage: {
      img: { type: String, required: true, trim: true },
      imgDesc: { type: String, required: true, trim: true },
    },
    video: {
      type: VideoSchema,
      default: () => ({}),
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
    status: {
      type: String,
      enum: ITEM_STATUSES,
      default: "not-published",
      required: true,
    },

    // INFO: Phase 2 variations
    variations: {
      type: [VariationSchema],
      default: [],
    },

    // INFO: Phase 3 SEO
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: { type: String, default: "", trim: true },
    shortDescription: { type: String, default: "", trim: true },
    keyWords: [{ type: String, trim: true }],
    faq: {
      type: [FaqSchema],
      default: [],
    },

    upSellItems: [
      {
        type: Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    crossSellItems: [
      {
        type: Schema.Types.ObjectId,
        ref: "Item",
      },
    ],

    // INFO: Statistics
    soldCount: { type: Number, default: 0, min: 0 },
    returnedCount: { type: Number, default: 0, min: 0 },

    // INFO: Rating
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
      ratings: {
        type: [RatingSchema],
        default: [],
      },
    },

    partners: {
      type: [PartnerItemSchema],
      default: [],
    },

    backOrder: {
      type: BackOrderSchema,
      default: () => ({}),
    },

    wishlist: {
      type: [WishlistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

ItemSchema.index({ categories: 1 });
ItemSchema.index({ tags: 1 });
ItemSchema.index({ status: 1 });
ItemSchema.index({ soldCount: -1 });
ItemSchema.index({ "rating.average": -1 });
ItemSchema.index({ "variations.size": 1, "variations.color": 1 });

export default model("Item", ItemSchema);