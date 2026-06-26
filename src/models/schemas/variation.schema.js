import { Schema } from "mongoose";
import MeasurementSchema from "./measurement.schema.js";
import { SIZES } from "../constants.js";

const VariationSchema = new Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
      enum: SIZES,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    image: {
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
    onAction: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: true,
      default: 2,
      min: 2,
    },
    actionPrice: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    measurements: {
      type: MeasurementSchema,
      default: () => ({}),
    },
  },
  { _id: true }
);

export default VariationSchema;