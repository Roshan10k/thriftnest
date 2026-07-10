import type { ActivityLog } from '../entities/ActivityLog';
import type { PaginationOptions } from './IUserRepository';

export interface IActivityLogRepository {
  create(data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
  findByUser(userId: string, options: PaginationOptions): Promise<{ logs: ActivityLog[]; total: number }>;
  findAll(options: PaginationOptions): Promise<{ logs: ActivityLog[]; total: number }>;
}
