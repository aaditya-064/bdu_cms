"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//! error handling
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const db_config_1 = require("./config/db.config");
const env_config_1 = __importDefault(require("./config/env.config"));
const nodemailer_config_1 = require("./config/nodemailer.config");
//* connect database
(0, db_config_1.db)(env_config_1.default.DB_URI);
//* listen
const server = app_1.default.listen(env_config_1.default.PORT, () => {
    console.log(`Server is running at port: ${env_config_1.default.PORT}`);
    (0, nodemailer_config_1.verifyMailServerConnection)();
});
process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
    process.exit(1);
});
process.on("SIGINT", () => {
    console.log("SIGINT received. Closing server...");
    server.close(async (error) => {
        console.log(error);
        await mongoose_1.default.disconnect();
        process.exit(0);
    });
});
// production (pm2, docker ...)
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Closing server...");
    server.close(async (error) => {
        console.log(error);
        await mongoose_1.default.disconnect();
        process.exit(0);
    });
});
