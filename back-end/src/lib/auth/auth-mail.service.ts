import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export type AuthEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Sends auth-related email. `log` only writes to the Nest log (dev).
   * `smtp` delivers through SMTP_HOST / SMTP_USER / SMTP_PASS.
   */
  async send(payload: AuthEmailPayload): Promise<void> {
    const provider = this.config.get<string>('EMAIL_PROVIDER', 'log');

    if (provider === 'log' || provider === '') {
      if (this.config.get<string>('NODE_ENV') !== 'production') {
        this.logger.log(
          `[auth email — EMAIL_PROVIDER=${provider || 'log'}] to=${payload.to} subject=${payload.subject}`,
        );
        this.logger.warn(payload.text);
      }
      return;
    }

    if (provider !== 'smtp') {
      throw new Error(`EMAIL_PROVIDER=${provider} is not implemented`);
    }

    const host = this.config.getOrThrow<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const user = this.config.getOrThrow<string>('SMTP_USER');
    const pass = this.config.getOrThrow<string>('SMTP_PASS');
    const from = this.config.get<string>('SMTP_FROM', user);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }

  async sendVerificationEmail(to: string, url: string): Promise<void> {
    await this.send({
      to,
      subject: 'Verify your email',
      text: `Verify your email by opening this link: ${url}`,
      html: `<p>Verify your email by opening this link:</p><p><a href="${url}">${url}</a></p>`,
    });
  }

  async sendResetPasswordEmail(to: string, url: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your password',
      text: `Reset your password by opening this link: ${url}`,
      html: `<p>Reset your password by opening this link:</p><p><a href="${url}">${url}</a></p>`,
    });
  }

  async sendNewPasswordEmail(
    to: string,
    input: { name: string; username: string | null; password: string },
  ): Promise<void> {
    const usernameLine = input.username ? `Username: ${input.username}\n` : '';
    const text = [
      `Hi ${input.name || 'there'},`,
      '',
      'A new password was set for your Money Management account.',
      '',
      `Email: ${to}`,
      usernameLine.trimEnd(),
      `New password: ${input.password}`,
      '',
      'Sign in with this password, then change it if you want.',
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    const html = `
      <p>Hi ${escapeHtml(input.name || 'there')},</p>
      <p>A new password was set for your Money Management account.</p>
      <p>Email: <strong>${escapeHtml(to)}</strong><br/>
      ${input.username ? `Username: <strong>${escapeHtml(input.username)}</strong><br/>` : ''}
      New password: <strong>${escapeHtml(input.password)}</strong></p>
      <p>Sign in with this password, then change it if you want.</p>
    `;

    await this.send({
      to,
      subject: 'Your new Money Management password',
      text,
      html,
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
