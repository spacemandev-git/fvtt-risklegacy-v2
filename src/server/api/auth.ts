// Authentication API routes
// Module 2.1: User Authentication API

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '../db/client.js';

const auth = new Hono();

// Environment variables
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this-in-production');
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '30d';

// Zod validation schemas
const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be at most 100 characters'),
});

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const RefreshSchema = z.object({
  refreshToken: z.string(),
});

// JWT utility functions
function parseExpiry(expiresIn: string): string {
  // Convert "15m", "30d" etc to seconds for JWT
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return '15m';

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return `${value}s`;
    case 'm': return `${value * 60}s`;
    case 'h': return `${value * 60 * 60}s`;
    case 'd': return `${value * 24 * 60 * 60}s`;
    default: return '15m';
  }
}

async function generateAccessToken(userId: string, username: string): Promise<string> {
  const expirySeconds = parseExpiry(ACCESS_TOKEN_EXPIRES_IN);

  return await new SignJWT({ userId, username, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirySeconds)
    .sign(JWT_SECRET);
}

async function generateRefreshToken(userId: string, username: string): Promise<{ token: string; expiresAt: Date }> {
  const expirySeconds = parseExpiry(REFRESH_TOKEN_EXPIRES_IN);

  const token = await new SignJWT({ userId, username, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirySeconds)
    .sign(JWT_REFRESH_SECRET);

  // Calculate expiry date
  const match = REFRESH_TOKEN_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  let expiryMs = 30 * 24 * 60 * 60 * 1000; // Default 30 days

  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': expiryMs = value * 1000; break;
      case 'm': expiryMs = value * 60 * 1000; break;
      case 'h': expiryMs = value * 60 * 60 * 1000; break;
      case 'd': expiryMs = value * 24 * 60 * 60 * 1000; break;
    }
  }

  const expiresAt = new Date(Date.now() + expiryMs);

  return { token, expiresAt };
}

async function verifyAccessToken(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'access') {
      return null;
    }

    return {
      userId: payload.userId as string,
      username: payload.username as string,
    };
  } catch (error) {
    return null;
  }
}

async function verifyRefreshToken(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);

    if (payload.type !== 'refresh') {
      return null;
    }

    return {
      userId: payload.userId as string,
      username: payload.username as string,
    };
  } catch (error) {
    return null;
  }
}

// POST /api/auth/register - Create new user
auth.post('/register', zValidator('json', RegisterSchema), async (c) => {
  try {
    const { username, password } = c.req.valid('json');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    // Hash password with 10 rounds (as per user's choice)
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate refresh token
    const userId = ''; // Will be set after user creation
    const { token: refreshToken, expiresAt: refreshTokenExpiry } = await generateRefreshToken(userId, username);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        refreshToken,
        refreshTokenExpiry,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    // Update refresh token with actual userId
    const { token: actualRefreshToken, expiresAt: actualRefreshTokenExpiry } = await generateRefreshToken(user.id, user.username);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: actualRefreshToken,
        refreshTokenExpiry: actualRefreshTokenExpiry,
      },
    });

    // Generate access token
    const accessToken = await generateAccessToken(user.id, user.username);

    return c.json({
      user,
      accessToken,
      refreshToken: actualRefreshToken,
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/auth/login - Login user
auth.post('/login', zValidator('json', LoginSchema), async (c) => {
  try {
    const { username, password } = c.req.valid('json');

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    // Generate tokens
    const accessToken = await generateAccessToken(user.id, user.username);
    const { token: refreshToken, expiresAt: refreshTokenExpiry } = await generateRefreshToken(user.id, user.username);

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiry,
      },
    });

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/auth/refresh - Refresh access token
auth.post('/refresh', zValidator('json', RefreshSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json');

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    // Check if refresh token exists in database and is not expired
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
      return c.json({ error: 'Refresh token expired' }, 401);
    }

    // Generate new access token
    const accessToken = await generateAccessToken(user.id, user.username);

    return c.json({
      accessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/auth/me - Get current user
auth.get('/me', async (c) => {
  try {
    // Get token from Authorization header
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify access token
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return c.json({ error: 'Invalid or expired access token' }, 401);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Export verification functions for use in middleware
export { verifyAccessToken, verifyRefreshToken };
export default auth;
