import { Schema } from "mongoose";

const PartnerItemSchema = new Schema(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    partnerCode: {
      type: String,
      trim: true,
      required: true,
    },
    partnerShare: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  { _id: true }
);

export default PartnerItemSchema;