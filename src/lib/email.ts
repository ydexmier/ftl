import { render } from '@react-email/render';
import { InvitationEmail } from './emails/InvitationEmail';
import { WelcomeEmail } from './emails/WelcomeEmail';
import { PasswordResetEmail } from './emails/PasswordResetEmail';
import { GuestInvitationEmail } from './emails/GuestInvitationEmail';

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@companion.yd-lab.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function envPrefix(): string {
  const env = process.env.VERCEL_ENV;
  if (env === 'preview') return '[PREVIEW] ';
  if (!env && process.env.NODE_ENV !== 'development') return '[LOCAL] ';
  return '';
}

async function sendEmail(to: string, subject: string, html: string) {
  const prefix = to.endsWith('@yd-lab.com') ? envPrefix() : '';
  const prefixedSubject = `${prefix}${subject}`;
  if (process.env.NODE_ENV === 'development') {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: false,
    });
    await transporter.sendMail({ from: EMAIL_FROM, to, subject: prefixedSubject, html });
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject: prefixedSubject, html });
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

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${APP_URL}/reset-password/${token}`;
  const html = await render(PasswordResetEmail({ link }));
  await sendEmail(to, 'Réinitialisation de ton mot de passe', html);
}

export async function sendGuestInvitationEmail(
  to: string,
  token: string,
  tournamentName: string,
  groupName: string,
  expiresAt: Date,
) {
  const link = `${APP_URL}/guest/${token}`;
  const html = await render(GuestInvitationEmail({ link, tournamentName, groupName, expiresAt }));
  await sendEmail(to, `Invitation au scouting — ${tournamentName}`, html);
}
