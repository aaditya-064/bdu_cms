import mongoose from "mongoose";

//* folder schema
const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "folder name is required"],
      minLength: [1, "folder name must not be empty"],
      maxLength: [200, "folder name cannot exceed 200 characters"],
      trim: true,
    },

    // Parent folder; null means root folder
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "folder",
      default: null,
    },

    category: {
      type: String,
      trim: true,
      default: "General",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "folder creator is required"],
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

//* folder indexes
folderSchema.index(
  { parentFolder: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $type: "null" },
    },
  },
);
//* folder model
const Folder = mongoose.model("Folder", folderSchema);

export default Folder;
