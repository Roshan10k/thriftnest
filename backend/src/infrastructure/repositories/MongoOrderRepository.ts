import { OrderModel } from '../database/models/OrderModel';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { PaginationOptions } from '../../domain/repositories/IUserRepository';
import type { Order, OrderStatus } from '../../domain/entities/Order';

const ORDER_POPULATE = ['listingId', 'buyerId', 'sellerId'];

function toEntity(doc: InstanceType<typeof OrderModel>): Order {
  return doc.toJSON() as unknown as Order;
}

export class MongoOrderRepository implements IOrderRepository {
  async findById(id: string): Promise<Order | null> {
    const doc = await OrderModel.findById(id).populate(ORDER_POPULATE);
    return doc ? toEntity(doc) : null;
  }

  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const doc = await OrderModel.create(data);
    return toEntity(doc);
  }

  async update(id: string, data: Partial<Order>): Promise<Order | null> {
    const doc = await OrderModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return doc ? toEntity(doc) : null;
  }

  async findByBuyer(buyerId: string, options: PaginationOptions): Promise<{ orders: Order[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      OrderModel.find({ buyerId }).skip(skip).limit(options.limit).sort({ createdAt: -1 }).populate(ORDER_POPULATE),
      OrderModel.countDocuments({ buyerId }),
    ]);
    return { orders: docs.map(toEntity), total };
  }

  async findBySeller(sellerId: string, options: PaginationOptions): Promise<{ orders: Order[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      OrderModel.find({ sellerId }).skip(skip).limit(options.limit).sort({ createdAt: -1 }).populate(ORDER_POPULATE),
      OrderModel.countDocuments({ sellerId }),
    ]);
    return { orders: docs.map(toEntity), total };
  }

  async findAll(options: PaginationOptions, status?: OrderStatus): Promise<{ orders: Order[]; total: number }> {
    const query = status ? { status } : {};
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      OrderModel.find(query).skip(skip).limit(options.limit).sort({ createdAt: -1 }).populate(ORDER_POPULATE),
      OrderModel.countDocuments(query),
    ]);
    return { orders: docs.map(toEntity), total };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await OrderModel.findByIdAndUpdate(id, { $set: { status } });
  }
}
