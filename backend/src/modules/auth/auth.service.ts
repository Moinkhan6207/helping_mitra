import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, RefreshToken } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.validation';
import { AuthUserResponse, LoginResponse, JWTPayload } from './auth.types';
import { AUTH_MESSAGES } from './auth.constants';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError, ForbiddenError, NotFoundError } from '../../core/errors/app.error';

export class AuthService {
  private authRepository = new AuthRepository();

  /**
   * Registers a new user account as USER role and ACTIVE status.
   */
  async register(input: RegisterInput): Promise<AuthUserResponse> {
    // 1. Check duplicate email
    const existingEmail = await this.authRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError(AUTH_MESSAGES.EMAIL_EXISTS);
    }

    // 2. Check duplicate mobile
    const existingMobile = await this.authRepository.findByMobile(input.mobile);
    if (existingMobile) {
      throw new ConflictError(AUTH_MESSAGES.MOBILE_EXISTS);
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    // 4. Create user record
    // Forces role = USER and status = ACTIVE as requested
    const user = await this.authRepository.createUser({
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      userType: input.userType,
      shopName: input.shopName,
      aadhaarNumber: input.aadhaarNumber,
      panNumber: input.panNumber,
      address: input.address,
      state: input.state,
      district: input.district,
      pinCode: input.pinCode,
    });

    return this.sanitizeUser(user);
  }

  /**
   * Performs user login validation, issues JWT access/refresh tokens.
   */
  async login(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    // 1. Look up user by email or mobile identifier
    let user: User | null = null;
    if (input.identifier.includes('@')) {
      user = await this.authRepository.findByEmail(input.identifier);
    } else {
      user = await this.authRepository.findByMobile(input.identifier);
    }

    // 2. Return safe unauthorized message if user not found
    if (!user) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // 3. Reject inactive users
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError(AUTH_MESSAGES.INACTIVE_ACCOUNT);
    }

    // 4. Verify password
    const isPasswordCorrect = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordCorrect) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // 5. Generate Access Token
    const accessToken = this.generateAccessToken(user);

    // 6. Generate Refresh Token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    // Save hashed refresh token to database
    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Refreshes an access token using a valid, non-revoked refresh token.
   */
  async refreshAccessToken(rawRefreshToken: string): Promise<string> {
    const tokenHash = this.hashToken(rawRefreshToken);

    // Find token with its associated user
    const session = await this.authRepository.findRefreshToken(tokenHash);
    if (!session) {
      throw new UnauthorizedError(AUTH_MESSAGES.TOKEN_INVALID);
    }

    // Check revocation status
    if (session.revokedAt) {
      throw new UnauthorizedError(AUTH_MESSAGES.TOKEN_REVOKED);
    }

    // Check expiration status
    if (new Date() > session.expiresAt) {
      throw new UnauthorizedError(AUTH_MESSAGES.TOKEN_EXPIRED);
    }

    // Check associated user account status
    if (session.user.status !== 'ACTIVE') {
      throw new ForbiddenError(AUTH_MESSAGES.INACTIVE_ACCOUNT);
    }

    // Generate new Access Token
    return this.generateAccessToken(session.user);
  }

  /**
   * Revokes a refresh token, logging the user session out.
   */
  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.authRepository.revokeRefreshToken(tokenHash);
  }

  /**
   * Retrieves profile details for a given authenticated user ID.
   */
  async getProfile(userId: string): Promise<AuthUserResponse> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return this.sanitizeUser(user);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Generates a JWT access token.
   */
  private generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      id: user.id,
      role: user.role,
      userType: user.userType,
      status: user.status,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET!, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });
  }

  /**
   * Hashes a raw refresh token using SHA-256.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Excludes sensitive KYC and password hash details.
   */
  private sanitizeUser(user: User): AuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      userType: user.userType,
      status: user.status,
    };
  }
}
