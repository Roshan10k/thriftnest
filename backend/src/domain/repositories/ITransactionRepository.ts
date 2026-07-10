import type { Transaction, TransactionType } from '../entities/Transaction';
import type { PaginationOptions } from './IUserRepository';

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  create(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  findByOrder(orderId: string): Promise<Transaction[]>;
  findByUser(userId: string, options: PaginationOptions): Promise<{ transactions: Transaction[]; total: number }>;
  findAll(options: PaginationOptions, type?: TransactionType): Promise<{ transactions: Transaction[]; total: number }>;
  updateStatus(id: string, status: 'completed' | 'failed'): Promise<void>;
}
