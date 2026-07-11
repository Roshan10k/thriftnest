import { TransactionModel } from '../database/models/TransactionModel';
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import type { PaginationOptions } from '../../domain/repositories/IUserRepository';
import type { Transaction, TransactionType } from '../../domain/entities/Transaction';

function toEntity(doc: InstanceType<typeof TransactionModel>): Transaction {
  return doc.toObject({ virtuals: true }) as unknown as Transaction;
}

export class MongoTransactionRepository implements ITransactionRepository {
  async findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async create(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const doc = await TransactionModel.create(data);
    return toEntity(doc);
  }

  async findByOrder(orderId: string): Promise<Transaction[]> {
    const docs = await TransactionModel.find({ orderId });
    return docs.map(toEntity);
  }

  async findByUser(userId: string, options: PaginationOptions): Promise<{ transactions: Transaction[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      TransactionModel.find({ userId }).skip(skip).limit(options.limit).sort({ createdAt: -1 }),
      TransactionModel.countDocuments({ userId }),
    ]);
    return { transactions: docs.map(toEntity), total };
  }

  async findAll(options: PaginationOptions, type?: TransactionType): Promise<{ transactions: Transaction[]; total: number }> {
    const query = type ? { type } : {};
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      TransactionModel.find(query).skip(skip).limit(options.limit).sort({ createdAt: -1 }),
      TransactionModel.countDocuments(query),
    ]);
    return { transactions: docs.map(toEntity), total };
  }

  async updateStatus(id: string, status: 'completed' | 'failed'): Promise<void> {
    await TransactionModel.findByIdAndUpdate(id, { $set: { status } });
  }
}
