import mongoose, { Schema } from "mongoose";

const vaultSchema = new Schema({
  title: {
    type: String,
    required: true,
    minlength: 3,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  website_url: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ["Bank", "Governemnt"],
  },
  notes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Active", "inActive"],
  },
  updated_at: Date,

  isLocked: {
    type: Boolean,
    default: true,
  },
  sharedWith: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
});

const Vault = mongoose.model("Vault", vaultSchema);

export default Vault;
