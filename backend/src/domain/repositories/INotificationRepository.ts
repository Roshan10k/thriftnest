import type { Notification } from '../entities/Notification';

export interface INotificationRepository {
  create(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  findByUser(userId: string): Promise<Notification[]>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  countUnread(userId: string): Promise<number>;
}
