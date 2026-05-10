import { render } from '@react-email/render';
import { InvitationEmail } from './emails/InvitationEmail';
import { WelcomeEmail } from './emails/WelcomeEmail';

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@companionlorcana.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.NODE_ENV === 'development') {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: false,
    });
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
  if (error) throw new Error(error.message);
}

export async function sendInvitationEmail(to: string, token: string) {
  const link = `${APP_URL}/register/${token}`;
  const html = await render(InvitationEmail({ link }));
  await sendEmail(to, 'Invitation à rejoindre Companion Lorcana', html);
}

export async function sendWelcomeEmail(to: string, username: string) {
  const html = await render(WelcomeEmail({ username, loginUrl: `${APP_URL}/login` }));
  await sendEmail(to, 'Bienvenue sur Companion Lorcana !', html);
}
