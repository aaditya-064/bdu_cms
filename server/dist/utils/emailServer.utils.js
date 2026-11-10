"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const env_config_1 = __importDefault(require("../config/env.config"));
const nodemailer_config_1 = __importDefault(require("../config/nodemailer.config"));
const sendEmail = async ({ html, subject, to, attachments, bcc, cc, }) => {
    try {
        // const { html, subject, to, attachments, bcc, cc } = options;
        const mailOptions = {
            to: to,
            from: env_config_1.default.SMTP_MAIL_FROM,
            subject: subject,
            html: html,
        };
        if (cc) {
            mailOptions["cc"] = cc;
        }
        if (bcc) {
            mailOptions["bcc"] = bcc;
        }
        if (attachments) {
            mailOptions["attachments"] = attachments;
        }
        await nodemailer_config_1.default.sendMail(mailOptions);
        console.log("mail sent");
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendEmail = sendEmail;
