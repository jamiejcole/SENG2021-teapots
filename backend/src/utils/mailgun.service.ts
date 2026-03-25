import FormData from "form-data";
import Mailgun from "mailgun.js";

function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY || process.env.API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || "teapotinvoicing.app";
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || "Teapot Invoicing <noreply@teapotinvoicing.app>";
  const url = process.env.MAILGUN_URL || "https://api.mailgun.net";
  const twoFactorTemplate = process.env.MAILGUN_2FA_TEMPLATE || "2fa template";

  if (!apiKey) {
    throw new Error("Missing Mailgun API key. Set MAILGUN_API_KEY (or API_KEY) in .env");
  }

  return { apiKey, domain, fromEmail, url, twoFactorTemplate };
}

function getMailgunClient() {
  const { apiKey, url } = getMailgunConfig();
  const mailgun = new Mailgun(FormData);

  return mailgun.client({
    username: "api",
    key: apiKey,
    url,
  });
}

export async function sendTwoFactorCode(
  email: string,
  code: string,
  userName: string
): Promise<void> {
  try {
    const { domain, fromEmail, twoFactorTemplate } = getMailgunConfig();
    const mg = getMailgunClient();

    await mg.messages.create(domain, {
      from: fromEmail,
      to: email,
      subject: `Your Teapot Invoicing 2FA Code, ${userName}`,
      template: twoFactorTemplate,
      "t:text": "yes",
      "o:tracking": "no",
      "h:X-Mailgun-Variables": JSON.stringify({
        helpLink: process.env.MAILGUN_HELP_LINK || "https://teapotinvoicing.app/support",
        privacyLink: process.env.MAILGUN_PRIVACY_LINK || "https://teapotinvoicing.app/privacy",
        securityLink: process.env.MAILGUN_SECURITY_LINK || "https://teapotinvoicing.app/account",
        verificationCode: code,
      }),
    });
  } catch (error) {
    console.error("Failed to send 2FA email:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send verification code";
    const err = new Error(errorMessage);
    (err as any).cause = error;
    throw err;
  }
}
