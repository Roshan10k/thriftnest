import { NotificationModel } from '../database/models/NotificationModel';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type { Notification } from '../../domain/entities/Notification';

function toEntity(doc: InstanceType<typeof NotificationModel>): Notification {
  return doc.toObject({ virtuals: true }) as unknown as Notification;
}

export class MongoNotificationRepository implements INotificationRepository {
  async create(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const doc = await NotificationModel.create(data);
    return toEntity(doc);
  }

  async findByUser(userId: string): Promise<Notification[]> {
    const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return docs.map(toEntity);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await NotificationModel.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
  }

  async delete(id: string, userId: string): Promise<void> {
    await NotificationModel.findOneAndDelete({ _id: id, userId });
  }

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, read: false });
  }
}
