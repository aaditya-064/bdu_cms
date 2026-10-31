//! error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

import mongoose from "mongoose";
import app from "./app";
import { db } from "./config/db.config";
import ENV_CONFIG from "./config/env.config";
import { verifyMailServerConnection } from "./config/nodemailer.config";

//* connect database
db(ENV_CONFIG.DB_URI);

//* listen
const server = app.listen(ENV_CONFIG.PORT, () => {
  console.log(`Server is running at port: ${ENV_CONFIG.PORT}`);
  verifyMailServerConnection();
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Closing server...");
  server.close(async (error) => {
    console.log(error);
    await mongoose.disconnect();
    process.exit(0);
  });
});

// production (pm2, docker ...)
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  server.close(async (error) => {
    console.log(error);
    await mongoose.disconnect();
    process.exit(0);
  });
});
