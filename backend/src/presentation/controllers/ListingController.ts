import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { ListingService } from '../../application/services/ListingService';
import { CreateListingDto, UpdateListingDto, ListingQueryDto } from '../../application/dtos/listing.dto';

export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  browse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = ListingQueryDto.parse(req.query);
      // A logged-in user should not see their own listings in the general
      // marketplace feed (they can't buy their own items).
      const result = await this.listingService.browse(query, req.user?.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.listingService.getById(req.params.id, req.user?.userId);
      res.json({ success: true, data: listing });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateListingDto.parse(req.body);
      const buffers = (req.files as Express.Multer.File[] ?? []).map((f) => f.buffer);
      const listing = await this.listingService.create(req.user!.userId, dto, buffers);
      res.status(201).json({ success: true, data: listing });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateListingDto.parse(req.body);
      const buffers = (req.files as Express.Multer.File[] ?? []).map((f) => f.buffer);
      const listing = await this.listingService.update(req.params.id, req.user!.userId, dto, buffers);
      res.json({ success: true, data: listing });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.listingService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, message: 'Listing removed' });
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: string };
      await this.listingService.updateStatus(req.params.id, req.user!.userId, status as never);
      res.json({ success: true, message: 'Status updated' });
    } catch (err) {
      next(err);
    }
  };

  myListings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const result = await this.listingService.getSellerListings(req.user!.userId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
