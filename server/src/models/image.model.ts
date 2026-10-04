import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: [true, "path is required"],
    },
    public_id: {
      type: String,
      required: [true, "public_id is required"],
    },
  },
  { _id: false },
);

export default ImageSchema;
