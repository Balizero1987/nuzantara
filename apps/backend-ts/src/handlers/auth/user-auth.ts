/**
 * User Authentication Handler
 * Complete user authentication system with registration, login, password management
 * Feature #11: User Authentication System
 */

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { logger } from '../../logging/unified-logger.js';
import { sendPasswordResetEmail } from '../../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'zantara-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// In-memory user store (MVP - replace with database in production)
interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  email_verified: boolean;
  last_login?: string;
  profile?: {
    phone?: string;
    company?: string;
    role?: string;
  };
}

const users: Map<string, User> = new Map();

// Helper: Generate user ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Generate JWT token
function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, type: 'user' }, JWT_SECRET, { expiresIn: '7d' });
}

// Helper: Generate refresh token
function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * User Registration
 */
export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  company?: string;
}) {
  const { email, password, name, phone, company } = params;

  try {
    // Validation
    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    // Check if user exists
    const existingUser = Array.from(users.values()).find((u) => u.email === email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = generateUserId();
    const user: User = {
      id: userId,
      email,
      password_hash,
      name,
      created_at: new Date().toISOString(),
      email_verified: false, // Email verification feature
      profile: {
        phone,
        company,
        role: 'user',
      },
    };

    users.set(userId, user);

    logger.info('User registered:', { userId, email });

    // Generate tokens
    const token = generateToken(userId, email);
    const refresh_token = generateRefreshToken(userId);

    return {
      ok: true,
      message: 'Registration successful',
      user: {
        id: userId,
        email,
        name,
        email_verified: false,
        profile: user.profile,
      },
      token,
      refresh_token,
    };
  } catch (error: any) {
    logger.error('Registration error:', error);
    throw error;
  }
}

/**
 * User Login
 */
export async function loginUser(params: { email: string; password: string }) {
  const { email, password } = params;

  try {
    // Find user
    const user = Array.from(users.values()).find((u) => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.last_login = new Date().toISOString();
    users.set(user.id, user);

    logger.info('User logged in:', { userId: user.id, email });

    // Generate tokens
    const token = generateToken(user.id, email);
    const refresh_token = generateRefreshToken(user.id);

    return {
      ok: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified,
        profile: user.profile,
        last_login: user.last_login,
      },
      token,
      refresh_token,
    };
  } catch (error: any) {
    logger.error('Login error:', error);
    throw error;
  }
}

/**
 * Refresh Token
 */
export async function refreshToken(refresh_token: string) {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refresh_token, JWT_SECRET) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    // Get user
    const user = users.get(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const new_token = generateToken(user.id, user.email);
    const new_refresh_token = generateRefreshToken(user.id);

    logger.info('Token refreshed:', { userId: user.id });

    return {
      ok: true,
      token: new_token,
      refresh_token: new_refresh_token,
    };
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Get User Profile
 */
export async function getUserProfile(userId: string) {
  try {
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified,
        profile: user.profile,
        created_at: user.created_at,
        last_login: user.last_login,
      },
    };
  } catch (error: any) {
    logger.error('Get profile error:', error);
    throw error;
  }
}

/**
 * Update User Profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    phone?: string;
    company?: string;
    role?: string;
  }
) {
  try {
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update fields
    if (updates.name) user.name = updates.name;
    if (updates.phone || updates.company || updates.role) {
      user.profile = {
        ...user.profile,
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.company && { company: updates.company }),
        ...(updates.role && { role: updates.role }),
      };
    }

    users.set(userId, user);

    logger.info('Profile updated:', { userId });

    return {
      ok: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
    };
  } catch (error: any) {
    logger.error('Update profile error:', error);
    throw error;
  }
}

/**
 * Change Password
 */
export async function changePassword(
  userId: string,
  params: {
    current_password: string;
    new_password: string;
  }
) {
  const { current_password, new_password } = params;

  try {
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (!new_password || new_password.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    // Hash new password
    user.password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    users.set(userId, user);

    logger.info('Password changed:', { userId });

    return {
      ok: true,
      message: 'Password changed successfully',
    };
  } catch (error: any) {
    logger.error('Change password error:', error);
    throw error;
  }
}

/**
 * Request Password Reset
 * Sends password reset email with secure reset link
 */
export async function requestPasswordReset(email: string) {
  try {
    const user = Array.from(users.values()).find((u) => u.email === email);

    // Generate reset token (valid for 1 hour)
    // Note: We generate token even for non-existent users to prevent email enumeration
    const reset_token = jwt.sign({ userId: user?.id || 'invalid', type: 'reset' }, JWT_SECRET, {
      expiresIn: '1h',
    });

    // If user exists, send reset email
    if (user) {
      logger.info({ userId: user.id, email }, 'Password reset requested');

      const emailResult = await sendPasswordResetEmail(email, reset_token);

      if (!emailResult.success) {
        logger.warn({ error: emailResult.error }, 'Failed to send password reset email');
        // Still return success to not reveal email existence
      }
    } else {
      logger.info({ email }, 'Password reset requested for non-existent email');
    }

    // Always return the same response to prevent email enumeration attacks
    return {
      ok: true,
      message: 'If the email exists, a reset link has been sent',
      // NOTE: reset_token is NOT returned to client in production
      // Token is only accessible via email link
    };
  } catch (error: any) {
    logger.error('Password reset request error:', error);
    // Return generic success message even on error to prevent enumeration
    return {
      ok: true,
      message: 'If the email exists, a reset link has been sent',
    };
  }
}

/**
 * Reset Password with Token
 */
export async function resetPassword(params: { reset_token: string; new_password: string }) {
  const { reset_token, new_password } = params;

  try {
    // Verify reset token
    const decoded = jwt.verify(reset_token, JWT_SECRET) as { userId: string; type: string };

    if (decoded.type !== 'reset') {
      throw new Error('Invalid reset token');
    }

    // Get user
    const user = users.get(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate new password
    if (!new_password || new_password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash new password
    user.password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    users.set(user.id, user);

    logger.info('Password reset:', { userId: user.id });

    return {
      ok: true,
      message: 'Password reset successful',
    };
  } catch (error: any) {
    logger.error('Password reset error:', error);
    throw new Error('Invalid or expired reset token');
  }
}

/**
 * Verify JWT Token (for middleware)
 */
export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };

    if (decoded.type !== 'user') {
      throw new Error('Invalid token type');
    }

    const user = users.get(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      ok: true,
      userId: user.id,
      email: user.email,
    };
  } catch (error: any) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify Email (Mock implementation)
 */
export async function verifyEmail(userId: string) {
  try {
    const user = users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.email_verified = true;
    users.set(userId, user);

    logger.info('Email verified:', { userId });

    return {
      ok: true,
      message: 'Email verified successfully',
    };
  } catch (error: any) {
    logger.error('Email verification error:', error);
    throw error;
  }
}

/**
 * Get All Users (Admin only - for testing)
 */
export async function getAllUsers() {
  const usersList = Array.from(users.values()).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    email_verified: user.email_verified,
    created_at: user.created_at,
    last_login: user.last_login,
  }));

  return {
    ok: true,
    users: usersList,
    total: usersList.length,
  };
}
