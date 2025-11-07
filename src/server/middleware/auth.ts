// Authentication middleware for protected routes
// Module 2.1: User Authentication API

import { Context, Next } from 'hono';
import { verifyAccessToken } from '../api/auth.js';

/**
 * Middleware to verify JWT access token
 * Attaches user info to context if valid
 */
export async function authMiddleware(c: Context, next: Next) {
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

    // Attach user info to context for use in route handlers
    c.set('userId', payload.userId);
    c.set('username', payload.username);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present and valid, but doesn't require it
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verifyAccessToken(token);

      if (payload) {
        c.set('userId', payload.userId);
        c.set('username', payload.username);
      }
    }

    await next();
  } catch (error) {
    // Silently fail for optional auth
    await next();
  }
}
