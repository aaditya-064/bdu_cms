import { MailOptions } from "nodemailer/lib/json-transport";
import ENV_CONFIG from "../config/env.config";
import transporter from "../config/nodemailer.config";

interface IMailOption {
  to: string | string[];
  html: string;
  subject: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
}

export const sendEmail = async ({
  html,
  subject,
  to,
  attachments,
  bcc,
  cc,
}: IMailOption) => {
  try {
    // const { html, subject, to, attachments, bcc, cc } = options;

    const mailOptions: MailOptions = {
      to: to,
      from: ENV_CONFIG.SMTP_MAIL_FROM,
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

    await transporter.sendMail(mailOptions);
    console.log("mail sent");
  } catch (error) {
    console.log(error);
  }
};
