import mongoose, { Schema, Document } from "mongoose";

export interface IVault extends Document {
  title: String;
  username: String;
  password: String;
  website_url: String;
  category: String;
  notes: String;
  status: String;
  updated_at: Date;
}

const vaultSchema = new Schema<IVault>({
  title: {
    type: String,
    required: [true, "title is required"],
    minLength: [3, "title must be atleast 3 characters long"],
    trim: true,
  },
  username: {
    type: String,
    required: [true, "username is required"],
    trim: true,
  },
  password: {
    type: String,
    required: [true, "password is required"],
    trim: true,
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
  updated_at: {
    type: Date,
  },
});

//* vault model
const Vault = mongoose.model("Vault", vaultSchema);
export default Vault;
