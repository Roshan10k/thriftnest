import { ActivityLogModel } from '../database/models/ActivityLogModel';
import type { IActivityLogRepository } from '../../domain/repositories/IActivityLogRepository';
import type { PaginationOptions } from '../../domain/repositories/IUserRepository';
import type { ActivityLog } from '../../domain/entities/ActivityLog';

function toEntity(doc: InstanceType<typeof ActivityLogModel>): ActivityLog {
  return doc.toObject({ virtuals: true }) as unknown as ActivityLog;
}

export class MongoActivityLogRepository implements IActivityLogRepository {
  async create(data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const doc = await ActivityLogModel.create(data);
    return toEntity(doc);
  }

  async findByUser(userId: string, options: PaginationOptions): Promise<{ logs: ActivityLog[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      ActivityLogModel.find({ userId }).skip(skip).limit(options.limit).sort({ createdAt: -1 }),
      ActivityLogModel.countDocuments({ userId }),
    ]);
    return { logs: docs.map(toEntity), total };
  }

  async findAll(options: PaginationOptions): Promise<{ logs: ActivityLog[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      ActivityLogModel.find().skip(skip).limit(options.limit).sort({ createdAt: -1 }),
      ActivityLogModel.countDocuments(),
    ]);
    return { logs: docs.map(toEntity), total };
  }
}
