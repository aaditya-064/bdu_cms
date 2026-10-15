import mongoose from "mongoose";

//* file schema
const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "file name is required"],
      trim: true,
      maxLength: [255, "file name cannot exceed 255 characters"],
    },

    originalName: {
      type: String,
      required: [true, "original file name is required"],
      trim: true,
    },

    // Folder containing the file
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "folder",
      default: null,
    },

    mimeType: {
      type: String,
      required: [true, "file MIME type is required"],
      trim: true,
    },

    extension: {
      type: String,
      trim: true,
      lowercase: true,
    },

    size: {
      type: Number,
      required: [true, "file size is required"],
      min: [0, "file size cannot be negative"],
    },

    // Cloudinary storage information
    storageProvider: {
      type: String,
      enum: ["cloudinary"],
      default: "cloudinary",
      required: true,
    },

    publicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
      trim: true,
    },

    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "raw",
    },

    // Optional URL; use authenticated delivery or signed URLs
    // when files are private.
    url: {
      type: String,
      trim: true,
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

    // Soft delete
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

//* file indexes
fileSchema.index({ parentFolder: 1, name: 1 });
fileSchema.index({ publicId: 1 }, { unique: true });

//* file model
const File = mongoose.model("file", fileSchema);

export default File;
