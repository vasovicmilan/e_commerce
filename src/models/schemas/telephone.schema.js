import { Schema } from "mongoose";

const TelephoneSchema = new Schema({
  value: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
});

export default TelephoneSchema;