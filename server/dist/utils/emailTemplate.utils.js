"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newLoginDetectedHtml = exports.accountCreatedHtml = void 0;
const env_config_1 = __importDefault(require("../config/env.config"));
const formatDate = (createdAt) => {
    const formattedDate = new Date(createdAt).toLocaleString("en-US", {
        dateStyle: "long",
        // timeStyle: "short",
        timeStyle: "short",
    });
    return formattedDate;
};
const accountCreatedHtml = ({ full_name, createdAt, email, }) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Account Created</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#7c3aed;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;">
                🎉 Welcome!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;color:#333333;">
              <h2 style="margin-top:0;">
                Hello ${full_name},
              </h2>

              <p style="font-size:16px;line-height:1.7;margin:16px 0;">
                Your account has been successfully created. We're excited to
                have you on board!
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;background:#f8f5ff;border:1px solid #e9d5ff;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;">
                      <strong>Email:</strong><br/>
                      ${email}
                    </p>

                    <p style="margin:0;">
                      <strong>Created At:</strong><br/>
                      ${formatDate(createdAt)}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;line-height:1.7;color:#555555;">
                You can now sign in and start using your account. If you did not
                create this account, please contact our support team immediately.
              </p>

              <div style="text-align:center;margin:36px 0;">
                <a
                  href="${env_config_1.default.FRONT_END_URL}/home"
                  style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;"
                >
                  Go to Dashboard
                </a>
              </div>

              <p style="font-size:14px;color:#666666;">
                Thanks,<br/>
                <strong>${env_config_1.default.APP_NAME} Team</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#faf5ff;padding:20px;text-align:center;font-size:12px;color:#777777;">
              © ${new Date().getFullYear()} ${env_config_1.default.APP_NAME}. All rights reserved.

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
    return html;
};
exports.accountCreatedHtml = accountCreatedHtml;
const newLoginDetectedHtml = ({ full_name, email, loginTime, device, }) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Login Detected</title>
</head>

<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#7c3aed;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;">
                🔐 New Login Detected
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;color:#333333;">

              <h2 style="margin-top:0;">
                Hi ${full_name},
              </h2>

              <p style="font-size:16px;line-height:1.7;margin:16px 0;">
                We detected a new sign in to your account. If this was you, no
                further action is required.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;background:#f8f5ff;border:1px solid #e9d5ff;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">

                    <p style="margin:0 0 14px;">
                      <strong>Account</strong><br />
                      ${email}
                    </p>

                    <p style="margin:0 0 14px;">
                      <strong>Login Time</strong><br />
                      ${formatDate(loginTime)}
                    </p>

                    <p style="margin:0 0 14px;">
                      <strong>Device</strong><br />
                      ${device}
                    </p>

                    
                  </td>
                </tr>
              </table>

              <div style="padding:18px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:6px;margin:24px 0;">
                <strong>Didn't recognize this login?</strong>
                <p style="margin:10px 0 0;line-height:1.6;color:#555;">
                  If you don't recognize this activity, change your password
                  immediately and review your account security settings.
                </p>
              </div>
              <div style="text-align:center;margin:36px 0;">
                <a
                  href="${env_config_1.default.FRONT_END_URL}/auth/change-password"
                  style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:8px;font-weight:bold;"
                >
                  Change Password
                </a>
              </div>
              

              <p style="font-size:14px;color:#666;">
                If this was your login, you can safely ignore this email.
              </p>

              <p style="font-size:14px;color:#666;margin-top:32px;">
                Thanks,<br />
                <strong>${env_config_1.default.APP_NAME} Team</strong>
              </p>

            </td>
          </tr>

          <tr>
            <td style="background:#faf5ff;padding:20px;text-align:center;font-size:12px;color:#777777;">
              © ${new Date().getFullYear()} ${env_config_1.default.APP_NAME}. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
    return html;
};
exports.newLoginDetectedHtml = newLoginDetectedHtml;
