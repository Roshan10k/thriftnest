export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface IEmailService {
  send(options: EmailOptions): Promise<void>;
  sendVerification(to: string, name: string, token: string): Promise<void>;
  sendPasswordReset(to: string, name: string, token: string): Promise<void>;
  sendOrderConfirmation(to: string, name: string, orderId: string, total: number): Promise<void>;
  sendSecurityAlert(to: string, name: string, action: string, ipAddress: string): Promise<void>;
}
