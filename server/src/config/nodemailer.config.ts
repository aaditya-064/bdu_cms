import nodemailer from "nodemailer";
import ENV_CONFIG from "./env.config";

const transporter = nodemailer.createTransport({
  host: ENV_CONFIG.SMTP_HOST,
  service: ENV_CONFIG.SMTP_SERVICE,
  port: ENV_CONFIG.SMTP_PORT, // 465
  secure: ENV_CONFIG.SMTP_PORT === 465, // true
  auth: {
    user: ENV_CONFIG.SMTP_USER,
    pass: ENV_CONFIG.SMTP_PASS, // app password
  },
});

export const verifyMailServerConnection = async () => {
  try {
    await transporter.verify();
    console.log("Server is ready to send email");
  } catch (error) {
    console.log("mail server connection error");
    console.log(error);
  }
};

export default transporter;
