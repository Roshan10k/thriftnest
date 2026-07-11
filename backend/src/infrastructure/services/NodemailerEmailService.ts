import nodemailer from 'nodemailer';
import type { IEmailService, EmailOptions } from '../../application/interfaces/IEmailService';

export class NodemailerEmailService implements IEmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    this.from = process.env.EMAIL_FROM ?? 'ThriftNest <noreply@thriftnest.com.np>';
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...options });
  }

  async sendVerification(to: string, name: string, token: string): Promise<void> {
    const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your ThriftNest account',
      html: `<p>Hi ${name},</p><p>Click <a href="${url}">here</a> to verify your email. This link expires in 24 hours.</p>`,
    });
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your ThriftNest password',
      html: `<p>Hi ${name},</p><p>Your password reset code is: <strong style="font-size:24px;letter-spacing:4px">${token}</strong></p><p>This code expires in 10 minutes.</p><p>If you did not request a password reset, ignore this email.</p>`,
    });
  }

  async sendOrderConfirmation(to: string, name: string, orderId: string, total: number): Promise<void> {
    await this.send({
      to,
      subject: 'Order Confirmed - ThriftNest',
      html: `<p>Hi ${name},</p><p>Your order <strong>#${orderId}</strong> has been confirmed. Total: <strong>NPR ${total.toLocaleString()}</strong>.</p>`,
    });
  }

  async sendSecurityAlert(to: string, name: string, action: string, ipAddress: string): Promise<void> {
    await this.send({
      to,
      subject: 'Security Alert - ThriftNest',
      html: `<p>Hi ${name},</p><p>A security event was detected on your account: <strong>${action}</strong> from IP <strong>${ipAddress}</strong>.</p><p>If this wasn't you, please <a href="${process.env.CLIENT_URL}/forgot-password">reset your password</a> immediately.</p>`,
    });
  }
}
