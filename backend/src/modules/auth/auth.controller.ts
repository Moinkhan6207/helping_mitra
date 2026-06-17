import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../core/responses/api.response';
import { catchAsync } from '../../core/errors/catchAsync';
import { AUTH_MESSAGES } from './auth.constants';

export class AuthController {
  private authService = new AuthService();

  /**
   * Registers a new user account.
   */
  register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.register(req.body);
    sendSuccess(res, AUTH_MESSAGES.REGISTRATION_SUCCESS, { user }, 201);
  });

  /**
   * Performs user login.
   */
  login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    const result = await this.authService.login(req.body, ipAddress, userAgent);
    sendSuccess(res, AUTH_MESSAGES.LOGIN_SUCCESS, result, 200);
  });

  /**
   * Refreshes access token.
   */
  refreshToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const accessToken = await this.authService.refreshAccessToken(refreshToken);
    sendSuccess(res, AUTH_MESSAGES.REFRESH_SUCCESS, { accessToken }, 200);
  });

  /**
   * Revokes refresh token (logout).
   */
  logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    await this.authService.logout(refreshToken);
    sendSuccess(res, AUTH_MESSAGES.LOGOUT_SUCCESS, {}, 200);
  });

  /**
   * Retrieves profile details of the currently authenticated user.
   */
  me = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const user = await this.authService.getProfile(userId);
    sendSuccess(res, 'Profile retrieved successfully', { user }, 200);
  });
}
