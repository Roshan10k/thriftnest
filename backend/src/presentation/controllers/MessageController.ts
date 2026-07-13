import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { MessageService } from '../../application/services/MessageService';

export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  getOrCreateConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { otherUserId, listingId } = req.body as { otherUserId: string; listingId?: string };
      const conv = await this.messageService.getOrCreateConversation(req.user!.userId, otherUserId, listingId);
      res.json({ success: true, data: conv });
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content, type, offerAmount } = req.body as {
        content: string;
        type?: 'text' | 'offer' | 'image' | 'system';
        offerAmount?: number;
      };
      const message = await this.messageService.sendMessage(
        req.user!.userId,
        req.params.conversationId,
        content,
        type,
        offerAmount,
      );
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  };

  respondToOffer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, counterAmount } = req.body as { action: 'accept' | 'decline' | 'counter'; counterAmount?: number };
      const result = await this.messageService.respondToOffer(
        req.user!.userId,
        req.params.conversationId,
        req.params.messageId,
        action,
        counterAmount,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 50);
      const result = await this.messageService.getMessages(req.user!.userId, req.params.conversationId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getConversations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const convs = await this.messageService.getUserConversations(req.user!.userId);
      res.json({ success: true, data: convs });
    } catch (err) {
      next(err);
    }
  };
}
