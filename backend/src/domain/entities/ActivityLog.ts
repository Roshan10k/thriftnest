export type LogStatus = 'success' | 'failed' | 'warning';

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  status: LogStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
