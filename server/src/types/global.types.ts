import mongoose from "mongoose";
import { Role } from "./enum.types";

export interface IImage {
  path: string;
  public_id: string;
}

export interface IJwtPayload {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: Role;
}

export interface IJwtReturn extends IJwtPayload {
  iat: number;
  exp: number;
}
