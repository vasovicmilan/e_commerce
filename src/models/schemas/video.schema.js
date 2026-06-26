import { Schema } from "mongoose";

const VideoSchema = new Schema(
  {
    vid: {
      type: String,
      trim: true,
    },
    vidDesc: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

export default VideoSchema;