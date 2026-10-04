import jwt from "jsonwebtoken";
import { IJwtPayload, IJwtReturn } from "../types/global.types";
import ENV_CONFIG from "../config/env.config";

//* generate token
export const generateJwtToken = (payload: IJwtPayload) => {
  try {
    return jwt.sign(payload, ENV_CONFIG.JWT_SECRET, {
      expiresIn: ENV_CONFIG.JWT_EXPIRES_IN as any,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//* verify jwt token
export const verifyJwtToken = (token: string) => {
  try {
    return jwt.verify(token, ENV_CONFIG.JWT_SECRET) as IJwtReturn;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
