import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';
import { AuthService } from '../../application/services/AuthService';
import { UserService } from '../../application/services/UserService';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { MongoActivityLogRepository } from '../../infrastructure/repositories/MongoActivityLogRepository';
import { BcryptHashService } from '../../infrastructure/services/BcryptHashService';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { NodemailerEmailService } from '../../infrastructure/services/NodemailerEmailService';
import { OtplibMfaService } from '../../infrastructure/services/OtplibMfaService';
import { AesCryptoService } from '../../infrastructure/services/AesCryptoService';
import { GoogleOAuthService } from '../../infrastructure/services/GoogleOAuthService';
import { LocalStorageService } from '../../infrastructure/services/LocalStorageService';

const router = Router();

const userRepo = new MongoUserRepository();

const service = new AuthService(
  userRepo,
  new MongoActivityLogRepository(),
  new BcryptHashService(),
  new JwtTokenService(),
  new NodemailerEmailService(),
  new OtplibMfaService(),
  new AesCryptoService(),
);

const userService = new UserService(
  userRepo,
  new LocalStorageService(),
  new BcryptHashService(),
);

const ctrl = new AuthController(service, userService, new GoogleOAuthService());

router.post('/register', authRateLimit, ctrl.register);
router.post('/login', authRateLimit, ctrl.login);
router.get('/oauth/google', authRateLimit, ctrl.oauthGoogleStart);
router.get('/oauth/google/callback', ctrl.oauthGoogleCallback);
router.post('/refresh', ctrl.refreshToken);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.post('/mfa/setup', authenticate, ctrl.setupMfa);
router.post('/mfa/confirm', authenticate, ctrl.confirmMfa);
router.delete('/mfa', authenticate, ctrl.disableMfa);
router.post('/forgot-password', authRateLimit, ctrl.forgotPassword);
router.post('/reset-password', authRateLimit, ctrl.resetPassword);

export default router;
