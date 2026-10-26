import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
   * Sends auth-related email. When no provider is configured, logs in development
   * only — does not claim delivery.
   */
  async send(payload: AuthEmailPayload): Promise<void> {
    const provider = this.config.get<string>('EMAIL_PROVIDER', 'log');

    if (provider === 'log' || provider === '') {
      if (this.config.get<string>('NODE_ENV') !== 'production') {
        this.logger.log(
          `[auth email not sent — EMAIL_PROVIDER=${provider || 'log'}] to=${payload.to} subject=${payload.subject}`,
        );
        this.logger.debug(payload.text);
      }
      return;
    }

    this.logger.warn(
      `EMAIL_PROVIDER=${provider} is not implemented; email to ${payload.to} was not sent.`,
    );
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
}
