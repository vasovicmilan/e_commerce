import { Schema } from "mongoose";

const PartnerSchema = new Schema(
  {
    isPartner: {
      type: Boolean,
      default: false,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    shop: {
      status: {
        type: Boolean,
        default: false,
      },
      colors: [
        {
          name: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      fonts: [
        {
          name: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      logo: {
        type: String,
      },
    },
    wallet: {
      type: Number,
      default: 0,
      min: 0,
    },
    rank: {
      points: {
        type: Number,
        default: 0,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      level: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxOffers: {
        type: Number,
        default: 1,
        min: 1,
      },
    },
    affiliateOffers: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        affiliateCode: {
          type: String,
          required: true,
        },
        soldCount: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    history: [
      {
        type: Schema.Types.ObjectId,
        ref: "History",
      },
    ],
  },
  { _id: false }
);

export default PartnerSchema;