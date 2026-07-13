import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { UserService } from '../../application/services/UserService';
import { UpdateProfileDto, ChangePasswordDto } from '../../application/dtos/user.dto';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  getPublicProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getPublicProfile(req.params.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateProfileDto.parse(req.body);
      const user = await this.userService.updateProfile(req.user!.userId, dto);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  updateAvatar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const result = await this.userService.updateAvatar(req.user!.userId, req.file.buffer);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ChangePasswordDto.parse(req.body);
      await this.userService.changePassword(req.user!.userId, dto);
      res.json({ success: true, message: 'Password changed' });
    } catch (err) {
      next(err);
    }
  };

  deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password } = req.body as { password: string };
      await this.userService.deleteAccount(req.user!.userId, password);
      res.json({ success: true, message: 'Account deleted' });
    } catch (err) {
      next(err);
    }
  };
}
