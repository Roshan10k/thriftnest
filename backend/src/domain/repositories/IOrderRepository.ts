import type { Order, OrderStatus } from '../entities/Order';
import type { PaginationOptions } from './IUserRepository';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order | null>;
  findByBuyer(buyerId: string, options: PaginationOptions): Promise<{ orders: Order[]; total: number }>;
  findBySeller(sellerId: string, options: PaginationOptions): Promise<{ orders: Order[]; total: number }>;
  findAll(options: PaginationOptions, status?: OrderStatus): Promise<{ orders: Order[]; total: number }>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
}
