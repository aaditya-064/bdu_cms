import dotenv from "dotenv";
dotenv.config();

const data = {
  ALLOWED_SITES: process.env.ALLOWED_WEBSITES,
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_EXPIRY_DATE: process.env.JWT_EXPIRY_DATE,
  CLOUDINARY_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_API_SECRET,
};

export default data;
