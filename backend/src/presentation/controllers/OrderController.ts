import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { OrderService } from '../../application/services/OrderService';
import { CreateOrderDto, UpdateOrderStatusDto } from '../../application/dtos/order.dto';

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateOrderDto.parse(req.body);
      const order = await this.orderService.create(req.user!.userId, dto);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderService.getById(req.params.id, req.user!.userId);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  myOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const result = await this.orderService.getBuyerOrders(req.user!.userId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  sellerOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const result = await this.orderService.getSellerOrders(req.user!.userId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateOrderStatusDto.parse(req.body);
      const order = await this.orderService.updateStatus(req.params.id, req.user!.userId, dto);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };
}
