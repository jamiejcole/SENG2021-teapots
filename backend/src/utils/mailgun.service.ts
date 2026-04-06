import FormData from "form-data";
import Mailgun from "mailgun.js";

const MAILGUN_SEND_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY || process.env.API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || "teapotinvoicing.app";
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || "Teapot Invoicing <noreply@teapotinvoicing.app>";
  const replyTo = process.env.MAILGUN_REPLY_TO || "Support Team <support@teapotinvoicing.app>";
  const url = process.env.MAILGUN_URL || "https://api.mailgun.net";
  const twoFactorTemplate = process.env.MAILGUN_2FA_TEMPLATE || "2fa template";
  const invoiceTemplate = process.env.MAILGUN_INVOICE_TEMPLATE || "invoice";
  const passwordResetTemplate = process.env.MAILGUN_PASSWORD_RESET_TEMPLATE || "password reset";

  if (!apiKey) {
    throw new Error("Missing Mailgun API key. Set MAILGUN_API_KEY (or API_KEY) in .env");
  }

  return { apiKey, domain, fromEmail, replyTo, url, twoFactorTemplate, invoiceTemplate, passwordResetTemplate };
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

    await withTimeout(mg.messages.create(domain, {
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
    }), MAILGUN_SEND_TIMEOUT_MS, "Mailgun 2FA send");
  } catch (error) {
    console.error("Failed to send 2FA email:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send verification code";
    const err = new Error(errorMessage);
    (err as any).cause = error;
    throw err;
  }
}

type InvoiceTemplateVariables = {
  amount: string;
  dueDate: string;
  invoiceNumber: string;
};

type MailgunAttachment = {
  data: Buffer | string;
  filename: string;
  contentType?: string;
};

type PasswordResetTemplateVariables = {
  firstName: string;
  resetLink: string;
  expiresInMinutes: number;
};

export async function sendInvoiceReadyEmail(
  email: string,
  variables: InvoiceTemplateVariables,
  attachments: MailgunAttachment[]
): Promise<void> {
  try {
    const { domain, fromEmail, replyTo, invoiceTemplate } = getMailgunConfig();
    const mg = getMailgunClient();

    await withTimeout(mg.messages.create(domain, {
      from: fromEmail,
      to: email,
      subject: "Your Invoice is Ready!",
      template: invoiceTemplate,
      "h:Reply-To": replyTo,
      "t:text": "yes",
      "o:tracking": "no",
      attachment: attachments,
      "h:X-Mailgun-Variables": JSON.stringify(variables),
    }), MAILGUN_SEND_TIMEOUT_MS, "Mailgun invoice send");
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send invoice email";
    const err = new Error(errorMessage);
    (err as any).cause = error;
    throw err;
  }
}

export async function sendDespatchAdviceEmail(
  email: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  try {
    const { domain, fromEmail, replyTo } = getMailgunConfig();
    const mg = getMailgunClient();

    await withTimeout(
      mg.messages.create(domain, {
        from: fromEmail,
        to: email,
        subject,
        html,
        text,
        "h:Reply-To": replyTo,
        "o:tracking": "no",
      }),
      MAILGUN_SEND_TIMEOUT_MS,
      "Mailgun despatch send"
    );
  } catch (error) {
    console.error("Failed to send despatch email:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send despatch email";
    const err = new Error(errorMessage);
    (err as any).cause = error;
    throw err;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  variables: PasswordResetTemplateVariables
): Promise<void> {
  try {
    const { domain, fromEmail, replyTo, passwordResetTemplate } = getMailgunConfig();
    const mg = getMailgunClient();

    await withTimeout(mg.messages.create(domain, {
      from: fromEmail,
      to: email,
      subject: "Reset your Teapot Invoicing password",
      template: passwordResetTemplate,
      "h:Reply-To": replyTo,
      "t:text": "yes",
      "o:tracking": "no",
      "h:X-Mailgun-Variables": JSON.stringify(variables),
    }), MAILGUN_SEND_TIMEOUT_MS, "Mailgun password reset send");
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send password reset email";
    const err = new Error(errorMessage);
    (err as any).cause = error;
    throw err;
  }
}
