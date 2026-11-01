import mongoose from "mongoose";
import ImageSchema from "./image.model";

//* file schema
const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "file name is required"],
      trim: true,
      maxLength: [255, "file name cannot exceed 255 characters"],
    },

    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    file: {
      type: ImageSchema,
      required: [true, "file is required"],
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "file uploader is required"],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

//* file indexes
fileSchema.index({ parentFolder: 1, name: 1 });
fileSchema.index({ "file.public_id": 1 }, { unique: true });

//* file model
const File = mongoose.model("file", fileSchema);

export default File;
