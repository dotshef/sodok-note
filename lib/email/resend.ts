import { Resend } from "resend";

const FROM_ADDRESS = "소독노트 <no-reply@dotshef.com>";

let client: Resend | null = null;

function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    client = new Resend(apiKey);
  }
  return client;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  attachments,
}: SendEmailParams): Promise<void> {
  const { error } = await getResendClient().emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
