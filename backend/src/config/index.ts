import dotenv from "dotenv";
import type { SignOptions } from "jsonwebtoken";

dotenv.config();

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("PORT must be a valid port number");
}

const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ||
  "1d") as SignOptions["expiresIn"];

export const config = {
  port,

  mongoUri: requiredEnv("MONGODB_URI"),

  jwtSecret: requiredEnv("JWT_SECRET"),

  jwtExpiresIn,

  encryptionKey: requiredEnv("ENCRYPTION_KEY"),

  n8nBaseUrl: process.env.N8N_BASE_URL || "",

  n8nApiKey: process.env.N8N_API_KEY || "",

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  nodeEnv: process.env.NODE_ENV || "development",
} as const;
