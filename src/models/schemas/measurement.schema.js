import { Schema } from "mongoose";

const MeasurementSchema = new Schema(
  {
    unit: {
      type: String,
      trim: true,
      enum: ["cm", "in"],
      default: "cm",
    },
    bust: { type: Number, min: 0 },
    chest: { type: Number, min: 0 },
    sleeve: { type: Number, min: 0 },
    length: { type: Number, min: 0 },
    waist: { type: Number, min: 0 },
    hips: { type: Number, min: 0 },
    inseam: { type: Number, min: 0 },
    rise: { type: Number, min: 0 },
    thigh: { type: Number, min: 0 },
    note: { type: String, trim: true },
  },
  { _id: false }
);

export default MeasurementSchema;