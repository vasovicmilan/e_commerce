import { Schema } from "mongoose";

const FaqSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

export default FaqSchema;