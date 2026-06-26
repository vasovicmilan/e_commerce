import { Schema } from "mongoose";

const AddressSchema = new Schema({
  city: {
    type: String,
    required: true,
    trim: true,
  },
  street: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
  },
  hash: {
    type: String,
    required: true,
  },
});

export default AddressSchema;